import { NetCDFReader } from 'netcdfjs';
import * as hdf5 from 'jsfive';

export const parseNetCDF = async (buffer) => {
    // Attempt 1: Standard NetCDF-3 (using netcdfjs)
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
            isHdf5: false,
            reader,
            dimensions,
            variables,
            globalAttributes: reader.globalAttributes
        };
    } catch (error) {
        console.log("Not a NetCDF-3 file, attempting NetCDF-4 (HDF5) parsing...");
        
        // Attempt 2: NetCDF-4 / HDF5 (using jsfive)
        try {
            const h5 = new hdf5.File(buffer, 'netcdf_file');
            
            // Map HDF5 structure to a NetCDF-like structure
            const variables = [];
            const collectVariables = (group, path = '') => {
                for (const key of group.keys) {
                    const item = group.get(key);
                    const itemPath = path === '/' ? `/${key}` : `${path}/${key}`;
                    
                    if (item instanceof hdf5.Dataset) {
                        variables.push({
                            name: itemPath,
                            dimensions: item.shape || [],
                            type: item.dtype || 'unknown',
                            size: item.value?.length || 0,
                            attributes: item.attrs || {},
                            isHdf5Dataset: true,
                            _raw: item
                        });
                    } else if (item instanceof hdf5.Group) {
                        collectVariables(item, itemPath);
                    }
                }
            };
            
            collectVariables(h5.root, '/');

            return {
                isHdf5: true,
                reader: h5,
                dimensions: [], // HDF5 doesn't explicitly store dimensions the same way as NC3
                variables,
                globalAttributes: h5.root.attrs || {}
            };
        } catch (h5Error) {
            console.error("NetCDF-4 Parsing error:", h5Error);
            throw new Error("Failed to parse NetCDF file. Format not supported (expected NetCDF-3 or NetCDF-4/HDF5).");
        }
    }
};

export const getVariableData = (reader, variableName, isHdf5 = false) => {
    try {
        if (isHdf5) {
            // Variable name in NetCDF-4 is the HDF5 path
            const dataset = reader.get(variableName);
            return dataset.value;
        } else {
            return reader.getDataVariable(variableName);
        }
    } catch (error) {
        console.error(`Error getting data for variable ${variableName}:`, error);
        throw new Error(`Failed to extract data for variable: ${variableName}`);
    }
};
