<template>
  <div class='persistence-window'>
    <template>
      <v-row>
        <v-col
          cols="4"
          sm="4"
        >
          <v-date-picker
            v-model="dates"
            range
          ></v-date-picker>
        </v-col>
        <v-col
          cols="4"
          sm="4"
        >
          <template>
            <v-row justify="center">
              <v-date-picker v-model="picker"></v-date-picker>
            </v-row>
          </template>
        </v-col>
        <v-col>
          <v-text-field
            v-model="dateRangeText"
            label="Date range"
            prepend-icon="mdi-calendar"
            readonly
          ></v-text-field>
          <v-btn color="secondary" elevation="2" @click="makePersistenceAnalysis">
            Make a persistance analysis
          </v-btn>
    <!-- before={{ dates[0] }} ...... after={{ dates[1] }} ...... date={{ picker }} -->
        </v-col>
      </v-row>
    </template>
  </div>
</template>
<script>
/* eslint-disable */

export default {
  data: () => ({
    dates: ['2019-09-10', '2019-09-20'],
    picker: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
  }),
  computed: {
    dateRangeText () {
      return this.dates.join(' ~ ')
    },
  },
  methods: {
    makePersistenceAnalysis: function () {
      this.$emit('persistenceData', {before: this.dates[0], after: this.dates[1], date: this.picker})
    }
  },
}
</script>
<style scoped>
.persistence-window {
  padding: 16px;
}
</style>