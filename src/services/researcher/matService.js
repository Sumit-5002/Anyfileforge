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

                // If it's a matrix (miMATRIX = 14)
                if (type === 14) {
                    let innerPos = pos + 8;

                    // 1. Array Flags
                    view.getUint32(innerPos, true);
                    let flagsBytes = view.getUint32(innerPos + 4, true);
                    innerPos += 8 + flagsBytes;

                    // 2. Dimensions
                    view.getUint32(innerPos, true);
                    let dimsBytes = view.getUint32(innerPos + 4, true);
                    const shape = [];
                    for (let i = 0; i < dimsBytes / 4; i++) {
                        shape.push(view.getInt32(innerPos + 8 + (i * 4), true));
                    }
                    innerPos += 8 + dimsBytes;

                    // 3. Name
                    let nameType = view.getUint32(innerPos, true);
                    let nameBytes = view.getUint32(innerPos + 4, true);
                    let name = 'unnamed';
                    if (nameType === 1) {
                        const nameArr = new Uint8Array(ab.slice(innerPos + 8, innerPos + 8 + nameBytes));
                        name = new TextDecoder().decode(nameArr).replace(/\0/g, '');
                    }
                    innerPos += 8 + (nameBytes + (8 - (nameBytes % 8)) % 8); // Align to 8 bytes

                    // 4. Data (Real part)
                    let data = [];
                    if (innerPos < pos + 8 + bytes) {
                        let dataType = view.getUint32(innerPos, true);
                        let dataBytes = view.getUint32(innerPos + 4, true);

                        // Simple data extraction for common types
                        if (dataType === 9) { // miDOUBLE
                            const floatArr = new Float64Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(floatArr);
                        } else if (dataType === 7) { // miSINGLE
                            const floatArr = new Float32Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(floatArr);
                        } else if (dataType === 2) { // miINT16
                            const intArr = new Int16Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(intArr);
                        } else if (dataType === 5) { // miINT32
                            const intArr = new Int32Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(intArr);
                        } else if (dataType === 4) { // miUINT16
                            const intArr = new Uint16Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(intArr);
                        } else if (dataType === 6) { // miUINT32
                            const intArr = new Uint32Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(intArr);
                        } else if (dataType === 1 || dataType === 3) { // miINT8 or miUINT8 (Common for images)
                            const intArr = new Uint8Array(ab.slice(innerPos + 8, innerPos + 8 + dataBytes));
                            data = Array.from(intArr);
                        }
                    }

                    variables.push({
                        name,
                        shape,
                        type: 'v5 Matrix',
                        isV5: true,
                        data: data
                    });
                }
                pos += 8 + bytes;
                // Align pos to 8 bytes if needed (MAT v5 tags are 8-byte aligned)
                if (pos % 8 !== 0) pos += (8 - (pos % 8));
            } catch {
                break;
            }
        }

        return {
            totalBytes: ab.byteLength,
            version: '5.0',
            status: "MAT v5 Workspace Hydrated (Discovery Mode)",
            variables,
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
