<template>
  <div>
    <v-row align="center" justify="center">
      <v-btn fab dark color="primary" small @click="dateDiff">
        <v-icon> mdi-arrow-left </v-icon>
      </v-btn>
      <v-col cols="3">
        <v-text-field
          :value="dateRange"
          label="Date jumper"
          readonly
        />
      </v-col>
      <v-btn fab dark color="primary" small @click="dateAdd">
        <v-icon> mdi-arrow-right </v-icon>
      </v-btn>
    </v-row>
  </div>
</template>
<script>
/* eslint-disable */
export default {
    props: {
      date: {
          type: Array,
          default: () => []
      },
      dateRange: {
          type: String,
          default: ""
      }
    },
    methods: {
      dateDiff: function () {
        var startDate = new Date(Date.parse(this.date[0]));
        var endDate = new Date(Date.parse(this.date[1]));
        var dateDiffInTime = endDate.getTime() - startDate.getTime();
        var dateDiffInDays = dateDiffInTime / (1000 * 3600 * 24);
        let newDate = [
          new Date(startDate.setDate(startDate.getDate() - dateDiffInDays))
            .toISOString()
            .substring(0, 10),
          this.date[0]
        ]
        this.$emit('changeDate', { date: newDate, });
        this.$emit('analize');
      },
      dateAdd: function () {
        var startDate = new Date(Date.parse(this.date[0]));
        var endDate = new Date(Date.parse(this.date[1]));
        var dateDiffInTime = endDate.getTime() - startDate.getTime();
        var dateDiffInDays = dateDiffInTime / (1000 * 3600 * 24);
        let newDate = [
          this.date[1],
          new Date(endDate.setDate(endDate.getDate() + dateDiffInDays))
            .toISOString()
            .substring(0, 10)
        ]
        this.$emit('changeDate', { date: newDate, });
        this.$emit('analize');
      },
  },
}
</script>