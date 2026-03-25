import { parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import alasql from 'alasql';

export const parseParquet = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const metadata = await parquetMetadataAsync(arrayBuffer);
        // We also want to read the first chunk of data or all of it for the viewer
        // But since this is purely browser side, we might read all objects.
        // It's safer to just expose two functions or parse all in one go if file is small.
        return {
            metadata,
            numberOfRows: Number(metadata.num_rows),
            rowGroups: metadata.row_groups.length,
            arrayBuffer
        };
    } catch (err) {
        throw new Error("Failed to parse Parquet file: " + err.message);
    }
};

export const fetchParquetData = async (arrayBuffer) => {
    try {
        const rows = await parquetReadObjects({ file: arrayBuffer });
        return rows;
    } catch (err) {
        throw new Error("Failed to read Parquet data: " + err.message);
    }
};

export const queryParquetData = (rows, sqlQuery) => {
    try {
        // use alasql to run query against javascript array
        const result = alasql(sqlQuery, [rows]);
        return result;
    } catch (err) {
        throw new Error("SQL Query Error: " + err.message);
    }
};
