<template>
    <div class="p-4 space-y-4" style="width: 800px;">
      <br /><br />
      <el-input v-model="topic" placeholder="请输入话题" @keyup.enter="fetchCommentsData" /><br /><br />
      <el-button type="primary" @click="fetchCommentsData">查询</el-button>
  
      <div v-if="chartData" class="chart-wrapper">
        <Pie 
          :data="chartData" 
          :options="{
            responsive: true,
            plugins: {
              legend: {
                position: 'right' as const,
                labels: {
                  font: {
                    size: 14,
                  },
                  color: '#333',
                },
              },
              title: {
                display: true,
                text: '评论者省份分布',
                font: {
                  size: 18,
                },
                color: '#2c3e50',
                padding: {
                  top: 10,
                  bottom: 30,
                },
              },
              tooltip: chartOptions.plugins.tooltip
            }
          }" 
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { Pie } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
  } from 'chart.js'
  import notesApi from '../../api/notes'
  import noteCommentsApi from '../../api/noteComments'
  
  ChartJS.register(Title, Tooltip, Legend, ArcElement)
  
  const topic = ref('')
  const chartData = ref()
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14,
          },
          color: '#333',
        },
      },
      title: {
        display: true,
        text: '评论者省份分布',
        font: {
          size: 18,
        },
        color: '#2c3e50',
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
        bodyFont: {
          size: 14,
        },
      },
    },
  }
  
  // 解析省份
  function extractProvince(ipLocation: string): string | null {
    if (!ipLocation) return null
    const suffixes = ['省', '市', '自治区', '特别行政区']
    for (const suffix of suffixes) {
      const idx = ipLocation.indexOf(suffix)
      if (idx !== -1) {
        return ipLocation.slice(0, idx + suffix.length)
      }
    }
    return ipLocation.length >= 2 ? ipLocation.slice(0, 2) : ipLocation
  }
  
  // 动态获取评论数据并生成饼图数据
  const fetchCommentsData = async () => {
    if (!topic.value.trim()) return
  
    const notes = await notesApi.getNotesBySelectVal(topic.value)
    const allComments: any[] = []
  
    for (const note of notes) {
      const comments = await noteCommentsApi.getCommentsByNoteId(note.noteId)
      allComments.push(...comments)
    }
  
    const provinceCount: Record<string, number> = {}
  
    allComments.forEach(comment => {
      const province = extractProvince(comment.ipLocation)
      if (province) {
        provinceCount[province] = (provinceCount[province] || 0) + 1
      }
    })
  
    const sortedEntries = Object.entries(provinceCount)
      .sort(([, a], [, b]) => b - a)
  
    const provinces = sortedEntries.map(([p]) => p)
    const counts = sortedEntries.map(([, c]) => c)
  
    chartData.value = {
      labels: provinces,
      datasets: [
        {
          data: counts,
          backgroundColor: generateColors(provinces.length),
        },
      ],
    }
  }
  
  // 使用 HSL 动态生成柔和渐变色
  function generateColors(num: number): string[] {
    const colors = []
    const hueStep = 360 / num
    for (let i = 0; i < num; i++) {
      const hue = i * hueStep
      colors.push(`hsl(${hue}, 70%, 65%)`)
    }
    return colors
  }
  </script>
  
  <style scoped>
  .chart-wrapper {
    width: 500px;
    height: 500px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    padding: 20px;
  }
  </style>
  