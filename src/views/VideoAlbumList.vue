<template>
    <div class="album-page">
        <el-card class="album-card">
            <div class="header">
                <h2>视频合集管理</h2>
                <el-button type="primary" @click="addAlbum">新增合集</el-button>
            </div>

            <el-table v-if="albums.length" :data="albums" style="width: 100%" border stripe>
                <el-table-column prop="title" label="合集标题" width="200" align="center" />
                <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip align="center" />
                <el-table-column prop="coverUrl" label="封面" width="720" align="center">
                    <template #default="{ row }">
                        <el-image style="width: 100%; height: 100%; object-fit: cover" :src="row.coverUrl" fit="cover"
                            :preview-src-list="[row.coverUrl]" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="800" align="center">
                    <template #default="{ row }">
                        <el-button size="medium" type="primary" @click="editAlbum(row)">编辑</el-button>
                        <el-button size="medium" type="danger" @click="deleteAlbum(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-empty v-else description="暂无视频合集" />
        </el-card>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import videoAlbumApi from '../api/videoAlbum';

export default defineComponent({
    name: 'VideoAlbumList',
    setup() {
        const albums = ref([]);

        const fetchAlbums = async () => {
            try {
                const response = await videoAlbumApi.getAllAlbums();
                albums.value = response.data;
            } catch (error) {
                console.error('Error fetching albums:', error);
            }
        };

        const addAlbum = () => {
            // Logic to add a new album
        };

        const editAlbum = (album: any) => {
            console.log('Editing album:', album);
            // Logic to edit album
        };

        const deleteAlbum = async (id: number) => {
            try {
                await videoAlbumApi.deleteAlbum(id);
                fetchAlbums(); // Refresh album list
            } catch (error) {
                console.error('Error deleting album:', error);
            }
        };

        onMounted(fetchAlbums);

        return {
            albums,
            addAlbum,
            editAlbum,
            deleteAlbum,
        };
    },
});
</script>

<style scoped>
.album-page {
    padding: 20px;
}

.album-card {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
</style>