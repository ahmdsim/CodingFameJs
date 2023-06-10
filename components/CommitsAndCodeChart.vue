<template>
    <div class="chart-div">
      <GChart
        v-if="Object.values(rawData).length > 0"
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
    reponame: {
      type: String,
    },
    rawData: {
      type: Object,
      default: () => {},
    },
    dates: {
      type: Array,
      default: () => [],
    },
    path: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      lineChartOptions: {
        title: this.reponame,
        legend: { position: "top" },
        series: {
          0: { targetAxisIndex: 0 },
          1: { targetAxisIndex: 1 },
        },
        vAxes: {
          // Adds titles to each axis.
          0: { title: "Commits", baseline: 0, },
          1: { title: "Changes", baseline: 0, },
        },
        height: 300,
        width: 1166,
      },
      lineChartData: [["Day", "Commits", "Changes"]],
    };
  },
  mounted() {
    this.createChartForDates();
    this.$emit('stopSpiner');
  },
  methods: {
    getDatesBetween: function (startDate, endDate, includeEndDate = true) {
      const dates = [];
      const currentDate = startDate;
      while (currentDate < endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      if (includeEndDate) dates.push(endDate);
      return dates;
    },
    createChartForDates() {
      const commits = {};
      const lines = {};
      this.lineChartData = [["Day", "Commits", "Changes"]]
      let repo = this.rawData[this.path] ? this.rawData[this.path] : [];
      console.log(repo)
        repo.forEach((commit) => {
        var date = new Date(commit.date);
        var dateKey = date.toISOString().substring(0, 10);
        commits[dateKey] = (commits[dateKey] ?? 0) + 1;
        lines[dateKey] =
          (lines[dateKey] ?? 0) +
          commit.stat.reduce((p, c) => p + c.added + c.deleted, 0);
        })

      var dates = this.getDatesBetween(
        new Date(this.dates[0]),
        new Date(this.dates[1])
      );

      if (dates.length < 30) {
        for (let index = 0; index < dates.length; index++) {
          const date = dates[index];
          const dateKey = date.toISOString().substring(0, 10);
          this.lineChartData.push([date, commits[dateKey] ?? 0, lines[dateKey] ?? 0]);
        }
      } else {
        var amountOfDates = dates.length < 120 ? 15 : 30;
        var period = parseInt(dates.length / amountOfDates, 10);
        var currentPeriod = 1;
        var commitsInPeriod = 0;
        var linesInPeriod = 0;
        for (let i = 0; i < dates.length; i++) {
          var date = dates[i];
          var dateKey = date.toISOString().substring(0, 10);
          commitsInPeriod += commits[dateKey] ?? 0;
          linesInPeriod += lines[dateKey] ?? 0;
          if (currentPeriod == period || dates.length == i + 1) {
            currentPeriod = 1;
            this.lineChartData.push([date, commitsInPeriod, linesInPeriod]);
            commitsInPeriod = 0;
            linesInPeriod = 0;
          }
          currentPeriod++;
        }
      }
    },
  },
  watch: {
    rawData: function (value) {
      this.createChartForDates()
      this.$emit('stopSpiner');
    }
  }
};
</script>
<style>
.chart-div {
  margin: auto;
  width:1166px;
}
</style>
