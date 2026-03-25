/**
 * Robust FASTA Parser Service
 */
export const parseFASTAStream = async (file, progressCallback) => {
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');

    let totalSequences = 0;
    let totalBases = 0;
    let gCount = 0;
    let cCount = 0;
    let hasStarted = false;
    
    const lengthDist = {};
    let currentSeqLen = 0;
    let buffer = '';
    let bytesRead = 0;
    const totalBytes = file.size;

    const commitCurrentSequence = () => {
        if (currentSeqLen > 0) {
            totalSequences++;
            lengthDist[currentSeqLen] = (lengthDist[currentSeqLen] || 0) + 1;
            currentSeqLen = 0;
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (value) {
            bytesRead += value.length;
            if (progressCallback && totalBytes) progressCallback(bytesRead / totalBytes);
            
            buffer += decoder.decode(value, { stream: !done });
            let newlineIdx;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, newlineIdx).trim();
                buffer = buffer.slice(newlineIdx + 1);

                if (line.startsWith('>')) {
                    commitCurrentSequence();
                    hasStarted = true;
                } else if (hasStarted && line.length > 0) {
                    const seq = line.toUpperCase().replace(/[^A-Z]/g, '');
                    currentSeqLen += seq.length;
                    for (let i = 0; i < seq.length; i++) {
                        const base = seq[i];
                        if (base === 'G') gCount++;
                        else if (base === 'C') cCount++;
                        totalBases++;
                    }
                }
            }
        }
        if (done) {
            commitCurrentSequence();
            break;
        }
    }

    if (totalSequences === 0) throw new Error("No valid sequences (>id) found in FASTA.");

    // N50/L50 Analysis
    const allLengths = [];
    Object.entries(lengthDist).forEach(([len, count]) => {
        for (let i = 0; i < count; i++) allLengths.push(Number(len));
    });
    allLengths.sort((a,b) => b-a);
    let n50 = 0, l50 = 0, cumulativeSum = 0;
    const halfTotal = totalBases / 2;
    for (let i = 0; i < allLengths.length; i++) {
        cumulativeSum += allLengths[i];
        if (cumulativeSum >= halfTotal) {
            n50 = allLengths[i];
            l50 = i + 1;
            break;
        }
    }

    return {
        totalSequences,
        totalBases,
        gcContent: totalBases > 0 ? ((gCount + cCount) / totalBases) * 100 : 0,
        lengthData: Object.keys(lengthDist).map(Number).sort((a,b) => a-b).map(len => ({
            length: len,
            count: lengthDist[len]
        })),
        n50,
        l50
    };
};
