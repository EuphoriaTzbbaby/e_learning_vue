import { get } from '../utils/axios'

export interface OssFoldersResponse {
    success: boolean
    folders: string[]
    message?: string
}

export interface OssUploadResponse {
    success: boolean
    message?: string
}

export const getUploadUrl = (): string => {
    // OSS 上传由后端接收 form-data，这里只提供上传地址给 el-upload 使用
    return `${import.meta.env.VITE_API_URL}/api/oss/upload`
}

export const getFolders = (): Promise<{
    data: OssFoldersResponse
}> => {
    return get<OssFoldersResponse>('/api/oss/folders')
}

