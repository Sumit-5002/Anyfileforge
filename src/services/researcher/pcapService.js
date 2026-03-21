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
        // const origLen = dataView.getUint32(offset + 12, isLittleEndian);
        
        if (inclLen > 65535 || inclLen < 0) break; // Defensive skip
        
        packets.push({
            id: packetCount + 1,
            length: inclLen,
            offset: offset + 16
        });
        
        offset += 16 + inclLen;
        packetCount++;
    }
    
    return {
        totalBytes: ab.byteLength,
        packetCount,
        network: network === 1 ? "Ethernet" : `Network Type ${network}`,
        status: "Analysis complete",
        packets: packets.slice(0, 50) // Preview first 50
    };
};
