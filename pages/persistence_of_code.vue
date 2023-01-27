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
                Make a persistance analysis
              </v-btn>
              <div>
                <router-link to="/"><v-btn color="primary">Back</v-btn></router-link>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <SurvivalsChart
      :persistence="persistence"
    />
    <router-view/>
  </div>
</template>
<script>
/* eslint-disable */
import SurvivalsChart from '../components/SurvivalsChart.vue';

export default {
  components: {
    SurvivalsChart,
  },
  data: () => ({
    dates: ["2019-09-10", "2019-09-20"],
    picker: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
    persistence: null,
    selectedRepoPath: "",
    selectedIgnores: [],
    bef: 0,
    aft: 0
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
          console.log(this.persistence);
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
        }
        this.$axios.$get(`/survival?repo=${this.selectedRepoPath}&after=${this.dates[0]}&before=${this.dates[1]}&date=${this.picker}`).then(function (result) {
          if (result.data) {
            console.log(localStorage.getItem("selectedRepoPath"));
            var persistence = Buffer.from(result.data);
            persistence = persistence.toString("utf8");
            persistence = JSON.parse(persistence);
            persistence.before = JSON.parse(persistence.before);
            persistence.after = JSON.parse(persistence.after);
            localStorage.setItem("persistenceResult", JSON.stringify(persistence));
          }
        });
      }, 10000);
    }
  }
}
</script>
<style scoped>
.persistence-window {
  padding: 16px;
}
</style>