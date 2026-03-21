import { parquetMetadataAsync } from 'hyparquet';

export const parseParquet = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    try {
        const metadata = await parquetMetadataAsync(arrayBuffer);
        return {
            metadata,
            numberOfRows: Number(metadata.num_rows),
            rowGroups: metadata.row_groups.length
        };
    } catch (err) {
        throw new Error("Failed to parse Parquet file: " + err.message);
    }
};
