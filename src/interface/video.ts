export interface Video {
    id?: number;          // 主键ID（新增时可不传）
    albumId: number;      // 专辑ID
    title: string;        // 视频标题
    ossKey: string;       // OSS存储key
    videoUrl: string;     // 视频地址
    duration: number;     // 时长（单位：秒）
    sortOrder: number;    // 排序
    createTime?: string;  // 创建时间（yyyy-MM-dd HH:mm:ss）
}