import { NetCDFReader } from 'netcdfjs';

export const parseNetCDF = (buffer) => {
    try {
        const reader = new NetCDFReader(buffer);
        const dimensions = reader.dimensions;
        const variables = reader.variables.map(v => ({
            name: v.name,
            dimensions: v.dimensions,
            type: v.type,
            size: v.size,
            attributes: reader.getVariableAttributes(v.name)
        }));
        
        return {
            reader,
            dimensions,
            variables,
            globalAttributes: reader.globalAttributes
        };
    } catch (error) {
        console.error("NetCDF Parsing error:", error);
        throw new Error("Failed to parse NetCDF file. It might be corrupted or in an unsupported format.");
    }
};

export const getVariableData = (reader, variableName) => {
    try {
        const data = reader.getDataVariable(variableName);
        return data;
    } catch (error) {
        console.error(`Error getting data for variable ${variableName}:`, error);
        throw new Error(`Failed to extract data for variable: ${variableName}`);
    }
};
