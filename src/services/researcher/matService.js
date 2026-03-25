import * as hdf5 from 'jsfive';

export const parseMat = async (file) => {
    const ab = await file.arrayBuffer();

    // Check for MAT v5 header
    const headerStr = new TextDecoder().decode(ab.slice(0, 50));
    if (headerStr.startsWith('MATLAB 5.0 MAT-file')) {
        const variables = [];
        const view = new DataView(ab);
        let pos = 128; // Header ends at 128

        while (pos < ab.byteLength - 8) {
            try {
                const type = view.getUint32(pos, true);
                const bytes = view.getUint32(pos + 4, true);

                if (type === 15) { // miCOMPRESSED
                    const compressedData = ab.slice(pos + 8, pos + 8 + bytes);
                    try {
                        // Attempt to decompress using browser-native DecompressionStream
                        const ds = new DecompressionStream('deflate');
                        const writer = ds.writable.getWriter();
                        writer.write(compressedData);
                        writer.close();
                        const response = new Response(ds.readable);
                        const inflatedAb = await response.arrayBuffer();
                        const inflatedView = new DataView(inflatedAb);
                        
                        // Process the inflated content (usually a single miMATRIX)
                        let iPos = 0;
                        while(iPos < inflatedAb.byteLength - 8) {
                            const iType = inflatedView.getUint32(iPos, true);
                            const iBytes = inflatedView.getUint32(iPos + 4, true);
                            if (iType === 14) { // miMATRIX
                                variables.push(extractV5Matrix(inflatedAb, iPos));
                            }
                            iPos += 8 + iBytes;
                            if (iPos % 8 !== 0) iPos += (8 - (iPos % 8));
                        }
                    } catch (e) {
                        console.warn("Decompression failed (v5):", e);
                    }
                } else if (type === 14) { // miMATRIX
                    variables.push(extractV5Matrix(ab, pos));
                }
                pos += 8 + bytes;
                if (pos % 8 !== 0) pos += (8 - (pos % 8));
            } catch { break; }
        }

        return {
            totalBytes: ab.byteLength,
            version: '5.0',
            status: variables.length > 0 ? "Workspace Reconnaissance Successful" : "Empty Workspace",
            variables: variables.filter(v => v !== null),
            isV5: true
        };
    }

    // Check if it's MAT v7.3 (HDF5)
    try {
        const h5file = new hdf5.File(ab, file.name);
        return {
            totalBytes: ab.byteLength,
            version: '7.3 (HDF5)',
            status: "MAT v7.3 Workspace Loaded",
            isHdf5: true,
            h5file
        };
    } catch {
        return {
            status: "Unknown format or CORRUPTED.",
            version: 'Unknown',
            variables: []
        };
    }
};

const extractV5Matrix = (ab, pos) => {
    const view = new DataView(ab);
    let innerPos = pos + 8;
    try {
        // Tag (miMATRIX) has 8 bytes: type and bytes
        view.getUint32(pos, true); 
        const totalMatrixBytes = view.getUint32(pos+4, true);

        // 1. Array Flags (Fixed 8 bytes)
        const flagsType = view.getUint32(innerPos, true);
        const flagsBytes = view.getUint32(innerPos + 4, true);
        innerPos += 8 + flagsBytes;

        // 2. Dimensions
        const dimsType = view.getUint32(innerPos, true);
        const dimsBytes = view.getUint32(innerPos + 4, true);
        const shape = [];
        for (let i = 0; i < dimsBytes / 4; i++) {
            shape.push(view.getInt32(innerPos + 8 + (i * 4), true));
        }
        innerPos += 8 + dimsBytes;

        // 3. Name
        let nameType = view.getUint32(innerPos, true);
        let nameBytes = view.getUint32(innerPos + 4, true);
        let name = 'unnamed';
        let dataStartOffset = 0;

        if (nameType > 0xFFFF) { // SDE
            nameBytes = nameType >> 16;
            nameType = nameType & 0xFFFF;
            const nameArr = new Uint8Array(ab.slice(innerPos + 4, innerPos + 4 + nameBytes));
            name = new TextDecoder().decode(nameArr).replace(/\0/g, '');
            dataStartOffset = 8;
        } else {
            const nameArr = new Uint8Array(ab.slice(innerPos + 8, innerPos + 8 + nameBytes));
            name = new TextDecoder().decode(nameArr).replace(/\0/g, '');
            dataStartOffset = 8 + (nameBytes + (8 - (nameBytes % 8)) % 8);
        }
        innerPos += dataStartOffset;

        // 4. Data
        let data = [];
        if (innerPos < pos + 8 + totalMatrixBytes) {
            let dataType = view.getUint32(innerPos, true);
            let dataBytes = view.getUint32(innerPos + 4, true);
            let valStart = innerPos + 8;
            
            if (dataType > 0xFFFF) { // SDE
                dataBytes = dataType >> 16;
                dataType = dataType & 0xFFFF;
                valStart = innerPos + 4;
            }

            if (dataType === 9) data = Array.from(new Float64Array(ab.slice(valStart, valStart + dataBytes)));
            else if (dataType === 7) data = Array.from(new Float32Array(ab.slice(valStart, valStart + dataBytes)));
            else if (dataType === 5) data = Array.from(new Int32Array(ab.slice(valStart, valStart + dataBytes)));
            else if (dataType === 6) data = Array.from(new Uint32Array(ab.slice(valStart, valStart + dataBytes)));
            else if (dataType === 3 || dataType === 1) data = Array.from(new Uint8Array(ab.slice(valStart, valStart + dataBytes)));
        }

        return { name, shape, type: 'v5 Matrix', isV5: true, data };
    } catch { return null; }
};
