<template>
    <div class="p-6 max-w-6xl mx-auto space-y-6" style = "width : 1200px;">
      <br><br>
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <el-input
          v-model="topic"
          placeholder="请输入话题"
          class="flex-1"
          @keyup.enter="fetchData"
        />
        <br><br>
        <el-button type="primary" @click="fetchData">查询</el-button>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-if="chartDataAll"
          class="rounded-2xl shadow-md p-4 bg-white flex flex-col items-center"
        >
          <Pie :data="chartDataAll" :options="{ 
            responsive: true,
            plugins: {
              legend: { 
                position: 'top' as const 
              },
              title: {
                display: true,
                text: '全部评论情感分布',
                font: { size: 18 },
                padding: {
                  top: 10,
                  bottom: 10
                }
              }
            }
          }" />
        </div>
        <div
          v-if="chartDataMale"
          class="rounded-2xl shadow-md p-4 bg-white flex flex-col items-center"
        >
          <Pie :data="chartDataMale" :options="{ 
            responsive: true,
            plugins: {
              legend: { 
                position: 'top' as const 
              },
              title: {
                display: true,
                text: '男性评论情感分布',
                font: { size: 18 },
                padding: {
                  top: 10,
                  bottom: 10
                }
              }
            }
          }" />
        </div>
        <div
          v-if="chartDataFemale"
          class="rounded-2xl shadow-md p-4 bg-white flex flex-col items-center"
        >
          <Pie :data="chartDataFemale" :options="{ 
            responsive: true,
            plugins: {
              legend: { 
                position: 'top' as const 
              },
              title: {
                display: true,
                text: '女性评论情感分布',
                font: { size: 18 },
                padding: {
                  top: 10,
                  bottom: 10
                }
              }
            }
          }" />
        </div>
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
  import { classifyTextSentiment } from '../../api/xhs'
  
  ChartJS.register(Title, Tooltip, Legend, ArcElement)
  
  const topic = ref('')
  const chartDataAll = ref()
  const chartDataMale = ref()
  const chartDataFemale = ref()
  
  // const baseChartOptions = (title: string) => ({
  //   responsive: true,
  //   plugins: {
  //     legend: { position: 'top' },
  //     title: {
  //       display: true,
  //       text: title,
  //       font: { size: 18 },
  //       padding: {
  //         top: 10,
  //         bottom: 10,
  //       },
  //     },
  //   },
  // })
  
  const classifyBatch = async (texts: string[]) => {
    const result: ('肯定' | '否定' | '中立')[] = []
    for (const text of texts) {
      try {
        const res = await classifyTextSentiment({ text })
        result.push(res.label as '肯定' | '否定' | '中立')
      } catch (error) {
        result.push('中立') // 错误兜底处理
      }
    }
    return result
  }
  
  const fetchData = async () => {
    if (!topic.value.trim()) return
  
    const notes = await notesApi.getNotesBySelectVal(topic.value)
    console.log(notes, 66666)
    const allComments: any[] = []
    for (const note of notes) {
      const comments = await noteCommentsApi.getCommentsByNoteId(note.noteId)
      allComments.push(...comments)
    }
  
    const maleComments = allComments.filter(c => c.gender === '男性')
    const femaleComments = allComments.filter(c => c.gender === '女性')
  
    const allSentiments = await classifyBatch(allComments.map(c => c.content))
    const maleSentiments = await classifyBatch(maleComments.map(c => c.content))
    const femaleSentiments = await classifyBatch(femaleComments.map(c => c.content))
  
    const countSentiments = (arr: ('肯定' | '否定' | '中立')[]) => ({
      肯定: arr.filter(s => s === '肯定').length,
      否定: arr.filter(s => s === '否定').length,
      中立: arr.filter(s => s === '中立').length,
    })
  
    const buildChartData = (counts: Record<string, number>) => ({
      labels: ['肯定', '否定', '中立'],
      datasets: [
        {
          data: [counts.肯定, counts.否定, counts.中立],
          backgroundColor: ['#4CAF50', '#F44336', '#9E9E9E'],
          borderWidth: 1,
        },
      ],
    })
  
    chartDataAll.value = buildChartData(countSentiments(allSentiments))
    chartDataMale.value = buildChartData(countSentiments(maleSentiments))
    chartDataFemale.value = buildChartData(countSentiments(femaleSentiments))
  }
  </script>
  
  <style scoped>
  /* 可选：增强外观 */
  body {
    background-color: #f9fafb;
  }
  </style>
  