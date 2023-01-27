<template>
  <div>
    <GChart
      type="ColumnChart"
      :data="lineChartData"
      :options="lineChartOptions"
    />
  </div>
</template>
<script>
/* eslint-disable */

import { GChart } from "vue-google-charts";

export default {
  components: {
    GChart,
  },
  props: {
    persistence: {
      type: Object,
      default: () => {},
    },
  },
  data: function () {
    return {
      lineChartData: [["Extensions", "Percentage of survival"]],
    };
  },
  mounted() {
    // this.updateChart()
  },
  methods: {
    updateChart: function () {
      if (persistence != null) {
        console.log(persistence)
        var oldExtensions = {};
        var newExtensions = {};
        for (person in this.persistence.before) {
          for (ext in this.persistence.before[person]) {
            if (ext != '.all') {
              if (ext in oldExtensions) {
                oldExtensions[ext] += person[ext]
              } else {
                oldExtensions[ext] = person[ext]
              }
            }
          }
        }
        for (person in this.persistence.after) {
          for (ext in this.persistence.after[person]) {
            if (ext != '.all') {
              if (ext in newExtensions) {
                newExtensions[ext] += person[ext]
              } else {
                newExtensions[ext] = person[ext]
              }
            }
          }
        }
        console.log(oldExtensions)
        console.log(newExtensions)
        let extPercent = []
        for (ext in oldExtensions) {
          extPercent.push([ext, (ext in newExtensions ? newExtensions[ext] : 0) / oldExtensions[ext]])
        }
        console.log(extPercent)
        this.lineChartData = this.lineChartData.concat(extPercent)
      }
    }
  },
  watch: {
    persistence: function (value) {
      this.updateChart()
    }
  }
}