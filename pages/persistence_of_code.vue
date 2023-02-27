<template>
  <div class="persistence-window">
    <div>
      <img src="/SmartInMediaLogo.svg" style="width: 500px;">
    </div>
    <template>
      <v-row>
        <v-col
          cols="2"
          sm="3"
        >
          <v-date-picker
            v-model="dates"
            range
            elevation="15"
          ></v-date-picker>
        </v-col>
        <v-col
          cols="2"
          sm="3"
        >
          <v-date-picker
            v-model="picker"
            elevation="15"
          ></v-date-picker>
        </v-col>
        <v-col>
          <v-card style="padding: 12px;">
            <v-card-text>
              <v-text-field
                v-model="dateRangeText"
                label="Date range"
                prepend-icon="mdi-calendar"
                readonly
              ></v-text-field>
              <h2>selected repo: {{ selectedRepoPath }}</h2>
              <h2>current ignores: {{ selectedIgnores }}</h2>
            </v-card-text>
            <v-card-actions>
              <v-btn color="secondary" elevation="2" @click="makePersistenceAnalysis">
                Make a persistence analysis
              </v-btn>
              <div>
                <router-link to="/"><v-btn color="primary">Back</v-btn></router-link>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <div>
      <GChart
        v-if="lineChartData && lineChartData.length > 1"
        style="padding-top: 80px;"
        type="ColumnChart"
        :data="lineChartData"
        :options="lineChartOptions"
      />
    </div>
    <router-view/>
  </div>
</template>
<script>
/* eslint-disable */
import SurvivalsChart from '../components/SurvivalsChart.vue';
import { GChart } from "vue-google-charts";

export default {
  components: {
    SurvivalsChart,
    GChart,
  },
  data: () => ({
    dates: ["2019-09-10", "2019-09-20"],
    picker: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
    persistence: null,
    selectedRepoPath: "",
    selectedIgnores: [],
    bef: 0,
    aft: 0,
    lineChartData: [["Extensions", "Percentage of survival"]],
    lineChartOptions: {
      title: 'Persistence',
      legend: { position: "top" },
      series: {
        0: { targetAxisIndex: 0 },
      },
      vAxes: {
        0: { title: "Preservation" },
      },
    },
  }),
  async mounted() {
    this.selectedRepoPath = localStorage.getItem("selectedRepoPath");
    this.selectedIgnores = localStorage.getItem("selectedIgnoredFiles");
    localStorage.setItem("persistenceResult", "");
  },
  computed: {
    dateRangeText() {
        return this.dates.join(" ~ ");
    },
  },
  methods: {
    makePersistenceAnalysis: async function () {
      var data = { before: this.dates[0], after: this.dates[1], date: this.picker };
      this.bef = 0;
      var persistenceTimer = setInterval((self) => {
        if (localStorage.getItem("persistenceResult")) {
          this.persistence = JSON.parse(localStorage.getItem("persistenceResult"));
          this.bef = 0;
          for (var per in this.persistence.before) {
            var person = this.persistence.before[per];
            this.bef += person[".all"];
          }
          this.aft = 0;
          for (var per in this.persistence.after) {
            var person = this.persistence.after[per];
            this.aft += person[".all"];
          }
          clearInterval(persistenceTimer);
        } else {
          this.$axios.$get(`/survival?repo=${this.selectedRepoPath}&after=${this.dates[0]}&before=${this.dates[1]}&date=${this.picker}`).then(function (result) {
            if (result.data) {
              var persistence = Buffer.from(result.data);
              persistence = persistence.toString("utf8");
              persistence = JSON.parse(persistence);
              if (persistence.before && persistence.after) {
                persistence.before = JSON.parse(persistence.before);
                persistence.after = JSON.parse(persistence.after);
                localStorage.setItem("persistenceResult", JSON.stringify(persistence));
              }
            }
          });
          }
      }, 10000);
    },
    updateChart: function () {
      if (this.persistence != null) {
        var oldExtensions = {};
        var newExtensions = {};
        for (var person in this.persistence.before) {
          for (var ext in this.persistence.before[person]) {
            if (ext != '.all') {
              if (ext in oldExtensions) {
                oldExtensions[ext] += this.persistence.before[person][ext]
              } else {
                oldExtensions[ext] = this.persistence.before[person][ext]
              }
            }
          }
        }
        for (var person in this.persistence.after) {
          for (var ext in this.persistence.after[person]) {
            if (ext != '.all') {
              if (ext in newExtensions) {
                newExtensions[ext] += this.persistence.after[person][ext]
              } else {
                newExtensions[ext] = this.persistence.after[person][ext]
              }
            }
          }
        }
        let extPercent = []
        for (var ext in oldExtensions) {
          extPercent.push([ext, (ext in newExtensions ? newExtensions[ext] : 0) / oldExtensions[ext]])
        }
        this.lineChartData = this.lineChartData.concat(extPercent)
      }
    },
  },
  watch: {
    persistence: function (value) {
      this.updateChart()
    }
  }
}
</script>
<style scoped>
.persistence-window {
  padding: 16px;
}
</style>