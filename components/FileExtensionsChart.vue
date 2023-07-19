<template>
  <div>
    <div v-if="status == 'failed'" style="height: 300px;">
      <v-icon size="100"  color="red">mdi-alert-circle</v-icon>
    </div>
    <div v-else>
      <GChart
        v-if="pieData.length != 0"
        type="PieChart"
        :options="pieChartOptions"
        :data="pieData"
      />
    </div>
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
    pieData: {
      type: Array,
      default: () => []
    },
    status: {
      type: String,
    },
  },
  data: function () {
    return {
      pieChartOptions: {
        width: 1100,
        height: 300
      },
      text: []
    };
  },
  mounted() {
    this.$emit("stopSpinerExtensions")
  },
  // methods: {
  // // },
  // watch: {
  //   pieData: function (value) {
  //     this.$emit("stopSpinerExtensions")
  //     console.log(1111111111111122222233333333333)
  //   }
  // }
};
</script>