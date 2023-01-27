<template>
  <div>
    <v-card>
      <v-simple-table
        v-if="filePreview"
        fixed-header
        height="600px"
      >
        <template #default>
          <thead>
            <tr>
              <th class="text-left">
                {{ selectedFileName }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item,idx) in filePreview.split('\n')"
              :key="idx"
              :class="{active: idx===selectedRow}"
              @click="selectRow(idx)"
            >
              <td class="fileRow"><pre>{{ item }} </pre></td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card>
    <div v-if="rowCommit">
      <v-card>
        <v-card-text>
          Author: {{ rowCommit.author }} <br/>
          Date: {{ rowCommit.date }} <br/>
          Description: {{ rowCommit.description }}
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    rowCommit: '',
    selectedRow: -1,
  }),
  props: {
      filePreview: {
          type: String,
          default: ''
      },
      selectedFileName: {
          type: String,
          default: ''
      },
      lastCommits: {
        type: Array,
        default: () => []
      },
  },
  methods: {
    selectRow: function (idx) {
      this.rowCommit = this.lastCommits[idx];
      this.selectedRow = idx;
    },
  }
}
</script>
<style scoped>
.fileRow {
  height: 5px !important;
  border: none !important;
}
.filePreview {
  max-height: 500px;
  overflow-y: auto;
}
</style>