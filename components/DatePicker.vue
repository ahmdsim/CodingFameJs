<template>
  <v-row justify="space-around">
    <v-col cols="3">
      <div class="date-from-range">
        <v-menu
          ref="datePicker"
          v-model="datePicker"
          :close-on-content-click="false"
          :return-value.sync="newDate"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ on, attrs }">
            <v-text-field
              :value="dateRange"
              label="Date filter"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
            />
          </template>
          <v-date-picker
            v-model="newDate"
            range
            no-title
            scrollable
            @change="saveDate"
          >
            <v-spacer />
            <v-btn text color="primary" @click="datePicker = false">
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.datePicker.save(newDate)"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
      </div>
    </v-col>
    <v-col cols="3">
      <div class="predefined-date-range">
        <v-select
          ref="predefinedDateRangeRef"
          v-model="newDate"
          :items="predifineDateRanges"
          label="Other ranges"
          item-text="title"
          item-value="value"
          @change="saveDate"
        />
      </div>
    </v-col>
    <v-col cols="3" />
  </v-row>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    predifineDateRanges:[
      {
        title: "Last 7 days",
        value: [
          new Date(new Date().setDate(new Date().getDate() - 7))
            .toISOString()
            .substring(0, 10),
          new Date().toISOString().substring(0, 10),
        ],
      },
      {
        title: "Last Month",
        value: [
          new Date(new Date().setDate(new Date().getDate() - 30))
            .toISOString()
            .substring(0, 10),
          new Date(Date.now()).toISOString().substring(0, 10),
        ],
      },
      {
        title: "Last 3 Months",
        value: [
          new Date(new Date().setDate(new Date().getDate() - 90))
            .toISOString()
            .substring(0, 10),
          new Date(Date.now()).toISOString().substring(0, 10),
        ],
      },
      {
        title: "Last 6 Months",
        value: [
          new Date(new Date().setDate(new Date().getDate() - 120))
            .toISOString()
            .substring(0, 10),
          new Date(Date.now()).toISOString().substring(0, 10),
        ],
      }
    ],
    datePicker: false,
    newDate: [],
  }),
  props: {
    date: {
      type: Array,
      default: () => []
    },
    dateRange: {
        type: String,
        default: ''
    },
  },
  methods: {
    saveDate: function() {
        this.$emit('changeDate', { date: this.newDate, });
        this.$refs['predefinedDateRangeRef'].reset();
        this.$refs.datePicker.save([]);
    }
  },
  
}
</script>