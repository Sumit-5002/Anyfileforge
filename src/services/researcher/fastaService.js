export const parseFASTAStream = async (file, progressCallback) => {
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');

    let totalSequences = 0;
    let totalBases = 0;
    let gCount = 0;
    let cCount = 0;
    
    // Track sequence lengths
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
            if (progressCallback && totalBytes) {
                progressCallback(bytesRead / totalBytes);
            }
            buffer += decoder.decode(value, { stream: !done });
            
            let newlineIdx;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, newlineIdx).trim();
                buffer = buffer.slice(newlineIdx + 1);

                if (line.startsWith('>')) {
                    commitCurrentSequence();
                } else if (line.length > 0) {
                    const seq = line.toUpperCase();
                    currentSeqLen += seq.length;
                    for (let i = 0; i < seq.length; i++) {
                        const base = seq[i];
                        if (base === 'G') gCount++;
                        if (base === 'C') cCount++;
                        if (base !== ' ' && base !== '\t') {
                            totalBases++;
                        }
                    }
                }
            }
        }
        if (done) {
            commitCurrentSequence();
            break;
        }
    }

    if (totalSequences === 0) {
        throw new Error("No valid sequences (>id) found in FASTA.");
    }

    const gcContent = totalBases > 0 ? ((gCount + cCount) / totalBases) * 100 : 0;
    
    const lengthsArray = Object.keys(lengthDist).map(Number).sort((a,b) => a-b);
    let lengthData = lengthsArray.map(len => ({
        length: len,
        count: lengthDist[len]
    }));

    return {
        totalSequences,
        totalBases,
        gcContent,
        lengthData
    };
};
