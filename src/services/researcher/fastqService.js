export const parseFASTQStream = async (file, progressCallback) => {
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');

    let totalSequences = 0;
    let gCount = 0;
    let cCount = 0;
    let totalBases = 0;
    const lengthDist = {};
    const qualitySums = [];
    const qualityCounts = [];

    let buffer = '';
    let lineIdx = 0; // 0=Header, 1=Seq, 2=+, 3=Qual
    let currentSeq = '';
    let currentHeader = '';
    let bytesRead = 0;
    const totalBytes = file.size;

    const reads = [];
    const maxReadsToCapture = 5000;

    while (true) {
        const { done, value } = await reader.read();
        if (value) {
            bytesRead += value.length;
            if (progressCallback && totalBytes) {
                progressCallback(bytesRead / totalBytes);
            }
            buffer += decoder.decode(value, { stream: !done });
            
            // Extract lines efficiently
            let newlineIdx;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, newlineIdx);
                if (line.endsWith('\r')) line = line.slice(0, -1);
                buffer = buffer.slice(newlineIdx + 1);

                // Process line based on lineIdx
                if (lineIdx === 0) {
                    if (line.startsWith('@')) {
                        currentHeader = line;
                        lineIdx = 1; 
                    }
                } else if (lineIdx === 1) {
                    currentSeq = line.toUpperCase();
                    lineIdx = 2;
                } else if (lineIdx === 2) {
                    if (line.startsWith('+')) lineIdx = 3;
                    else lineIdx = 0; // Sync lost, look for next @
                } else if (lineIdx === 3) {
                    const qual = line;
                    if (qual.length === currentSeq.length) { 
                        totalSequences++;
                        const seqLen = currentSeq.length;
                        lengthDist[seqLen] = (lengthDist[seqLen] || 0) + 1;

                        if (reads.length < maxReadsToCapture) {
                            reads.push({
                                id: currentHeader,
                                seq: currentSeq,
                                qual: qual,
                                len: seqLen
                            });
                        }

                        for (let j = 0; j < seqLen; j++) {
                            const base = currentSeq[j];
                            if (base === 'G') gCount++;
                            if (base === 'C') cCount++;
                            totalBases++;

                            const qScore = qual.charCodeAt(j) - 33;
                            if (j >= qualitySums.length) {
                                qualitySums.push(0);
                                qualityCounts.push(0);
                            }
                            qualitySums[j] += qScore;
                            qualityCounts[j]++;
                        }
                    }
                    lineIdx = 0; 
                }
            }
        }
        if (done) break;
    }

    if (totalSequences === 0) {
        throw new Error("No valid FASTQ sequences found. Are you sure this is a FASTQ file?");
    }

    const gcContent = totalBases > 0 ? ((gCount + cCount) / totalBases) * 100 : 0;
    const meanQualities = qualitySums.map((sum, idx) => sum / qualityCounts[idx]);
    
    const lengthsArray = Object.keys(lengthDist).map(Number).sort((a,b) => a-b);
    const lengthData = lengthsArray.map(len => ({
        length: len,
        count: lengthDist[len]
    }));

    return {
        totalSequences,
        totalBases,
        gcContent,
        meanQualities,
        lengthData,
        reads // Return captured reads for export
    };
};
