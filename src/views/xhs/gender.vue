<template>
    <div class="p-4 space-y-4" style = "width : 800px;">
      <br><br>
      <el-input v-model="topic" placeholder="请输入话题" @keyup.enter="fetchCommentsData" /><br><br>
      <el-button type="primary" @click="fetchCommentsData">查询</el-button>
  
      <div v-if="chartData" style="width: 500px; height: 500px; margin: 0 auto;">
        <Pie :data="chartData" :options="{
          responsive: true,
          plugins: {
            legend: {
              position: 'top' as const,
            },
            title: {
              display: true,
              text: '评论者性别比例',
            },
          },
        }" />
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
  // const chartOptions = {
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: 'top',
  //     },
  //     title: {
  //       display: true,
  //       text: '评论者性别比例',
  //     },
  //   },
  // }
  
  const fetchCommentsData = async () => {
    if (!topic.value.trim()) return;
  
    const notes = await notesApi.getNotesBySelectVal(topic.value)
    const allComments: any[] = []
  
    for (const note of notes) {
      const comments = await noteCommentsApi.getCommentsByNoteId(note.noteId)
      allComments.push(...comments)
    }
  
    const genderCount = { male: 0, female: 0, unknown: 0 }
  
    allComments.forEach(comment => {
      if (comment.gender === '男性') genderCount.male++
      else if (comment.gender === '女性') genderCount.female++
      else genderCount.unknown++
    })
  
    chartData.value = {
      labels: ['男性', '女性', '未知'],
      datasets: [
        {
          data: [genderCount.male, genderCount.female, genderCount.unknown],
          backgroundColor: ['#36A2EB', '#FF6384', '#CCCCCC'],
        },
      ],
    }
  }
  </script>
  