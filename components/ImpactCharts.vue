<template>
  <div v-if="pieDatas.length >= 0" >
    <v-row>
      <v-col cols="9">
        <GChart
          type="PieChart"
          :options="personalPieChartOptions"
          :data="personalImpact"
        />
      </v-col>
      <v-col cols="3">
        <v-checkbox
          v-for="ext in checkedPieDatas"
          v-model="ext['isChecked']"
          :label="ext['ext']"
          :value="ext['ext']"
          :key="ext['ext']"
        ></v-checkbox>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="pieData in checkedPieDatas.filter((pieData) => pieData.isChecked)" :key="pieData['ext']" cols="6">
        <GChart
          type="PieChart"
          :options="{
            width: 600,
            height: 200,
            title: pieData['ext'],
            chartArea: {width: '100%'}
          }"
          :data="pieData['pieData']"
        />
      </v-col>
    </v-row>
  </div>
</template>
<script>
/* eslint-disable */
import { GChart } from "vue-google-charts";
export default {
  components: {
    GChart
  },
  props: {
    pieDatas: {
      type: Array,
      default: () => []
    },
    personalImpact: {
      type: Array,
      default: () => []
    },
  },
  async mounted () {
    this.checkedPieDatas = this.pieDatas.map((pieData) => ({ext: pieData.ext, pieData: pieData.pieData, isChecked: false}))
  },
  data: function () {
    return {
      personalPieChartOptions: {
        width: 600,
        height: 300,
        chartArea: {width: '100%'}
      },
      checkedPieDatas: []
    }
  },
  watch: {
    pieDatas: function () {
      this.checkedPieDatas = this.pieDatas.map((pieData) => ({pieData: pieData['pieData'], ext: pieData['ext'], isChecked: false}))
    }
  },
};
</script>
<style scoped>
.v-messages theme--light primary--text {
  height: 0px;
}
.v-input--selection-controls.v-input {
  margin: 0px;
}
.theme--light.v-messages {
  height: 0px !important;
}
</style>