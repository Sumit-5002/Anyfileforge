export const parsePcap = async (file) => {
    const ab = await file.arrayBuffer();
    const dataView = new DataView(ab);
    
    // Verify PCAP magic number
    const magic = dataView.getUint32(0, true);
    let isLittleEndian = true;
    
    if (magic === 0xa1b2c3d4) isLittleEndian = true;
    else if (magic === 0xd4c3b2a1) isLittleEndian = false;
    else if (magic === 0xa1b23c4d) isLittleEndian = true; // nanosec
    else if (magic === 0x4dc3b2a1) isLittleEndian = false; // nanosec
    else {
        throw new Error("Invalid PCAP magic number. File might not be a valid pcap capture.");
    }
    
    const network = dataView.getUint32(20, isLittleEndian);
    
    // Basic packet counting
    let offset = 24; // Global header size
    let packetCount = 0;
    const packets = [];
    
    while (offset + 16 <= ab.byteLength && packetCount < 1000) {
        // Packet Header (16 bytes)
        // const tsSec = dataView.getUint32(offset, isLittleEndian);
        // const tsUsec = dataView.getUint32(offset + 4, isLittleEndian);
        const inclLen = dataView.getUint32(offset + 8, isLittleEndian);
        const tsSec = dataView.getUint32(offset, isLittleEndian);
        
        if (inclLen > 65535 || inclLen <= 0) break; // Defensive skip
        
        // Extract Hex Preview
        const payloadOffset = offset + 16;
        const previewLen = Math.min(inclLen, 32);
        const hexArr = [];
        for (let j = 0; j < previewLen; j++) {
            if (payloadOffset + j < ab.byteLength) {
                hexArr.push(dataView.getUint8(payloadOffset + j).toString(16).padStart(2, '0'));
            }
        }

        packets.push({
            id: packetCount + 1,
            length: inclLen,
            offset: payloadOffset,
            timestamp: new Date(tsSec * 1000).toLocaleTimeString(),
            payloadHex: hexArr.join(' ')
        });
        
        offset += 16 + inclLen;
        packetCount++;
    }
    
    return {
        totalBytes: ab.byteLength,
        packetCount,
        network: network === 1 ? "Ethernet" : `Network Link ${network}`,
        status: "Protocol Summary Ready",
        packets: packets
    };
};
