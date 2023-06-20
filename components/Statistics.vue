<template>
  <v-row justify="space-around">
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-source-commit</v-icon>
          <div class="stats-headline">Commits</div>
          <div class="stats-value">{{ repos.reduce((a, b) => a + b.commits, 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-text-box-plus-outline</v-icon>
          <div class="stats-headline">Lines added</div>
          <div class="stats-value">+{{ repos.reduce((a, b) => a + (b.lines.added || 0), 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="4">
      <v-card class="stats">
        <v-card-text>
          <v-icon>mdi-text-box-minus-outline</v-icon>
          <div class="stats-headline">Lines Deleted</div>
          <div class="stats-value">-{{ repos.reduce((a, b) => a + (b.lines.deleted || 0), 0) }}</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="6">
      <v-card class="repository-list" flat tile>
        <v-toolbar elevation="0">
          <v-toolbar-title><v-icon>mdi-git</v-icon>Repositories</v-toolbar-title>
        </v-toolbar>
        <v-list three-line>
          <template v-for="repository in repos">
            <v-list-item v-if="repository.path" :key="repository.path">
              <v-list-item-avatar>
                <v-icon>mdi-source-branch</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ repository.path }}</v-list-item-title>
                <v-list-item-subtitle>
                  Commits: {{ repository.commits }}<br>
                  Lines of code: +{{ repository.lines.added }} -{{
                    repository.lines.deleted
                  }} Total: {{ repository.lines.added - repository.lines.deleted }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </v-col>
    <v-col cols="6">
      <div>
        <v-dialog
          v-model="overlay"
          width="700px"
          max-height="700px;"
          persistent
          scrollable
          class="dialog-window"
        >
        <v-card
          height="700px"
        >
          <div class="close-icon">
            <v-icon class="close-box" @click="overlay=false;">
              mdi-close-box
            </v-icon>
          </div>
          <v-list three-line>
            <v-list-group
              v-for="author in sortedAuthors"
              :key="author.email"
              v-model="author.active"
            >
              <template #activator>
                <v-list-item-avatar>
                  <v-icon>mdi-account-outline</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ author.email }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Commits: {{ author.commits }} <br> LoC: +{{ author.lines.added }} -{{
                      author.lines.deleted }} T: {{ author.lines.added - author.lines.deleted }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
              <v-list-item
                v-for="(commit, index) in author.details"
                v-bind:id="[author.email.replace(/@|\./g, ''), index].join('_')"
                :key="commit[0]"
                class="commit-info"
                :class="{oddCommit: index % 2 != 0, isActive: [author.email.replace(/@|\./g, ''), index].join('_') == activeNod}"
              >
                <v-list-item-title><v-icon>mdi-source-commit</v-icon> {{ commit[0].slice(0, 7) }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ commit[1] }} LoC: +{{ commit[2][0] }} -{{ commit[2][1] }} T: {{ commit[2][0] - commit[2][1] }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
        </v-dialog>
        <v-card class="author-list" flat tile>
          <v-toolbar elevation="0">
            <v-toolbar-title><v-icon>mdi-account-group</v-icon>Top Authors</v-toolbar-title>
            <v-spacer />
          </v-toolbar>
          <v-list three-line class="top-authors-toolbar">
            <v-list-group
              v-for="author in sortedAuthors"
              :key="author.email"
              v-model="author.active"
              no-action
            >
              <template #activator>
                <v-list-item-avatar>
                  <v-icon>mdi-account-outline</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>{{ author.email }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Commits: {{ author.commits }} <br> LoC: +{{ author.lines.added }} -{{
                      author.lines.deleted }} T: {{ author.lines.added - author.lines.deleted }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
              <v-list-item
                v-for="(commit, index) in author.details"
                :key="commit[0]"
                class="commit-info"
                :class="{oddCommit: index % 2 != 0}"
                @click="openList(index, author);"
              >
                <v-list-item-title><v-icon>mdi-source-commit</v-icon> {{ commit[0].slice(0, 7) }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ commit[1] }} LoC: +{{ commit[2][0] }} -{{ commit[2][1] }} T: {{ commit[2][0] - commit[2][1] }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
      </div>
    </v-col>
  </v-row>
</template>
<script>
/* eslint-disable */
export default {
  data: () => ({
    overlay: false,
    activeNod: ''
  }),
  props: {
    repos: {
        type: Array,
        default: () => []
    },
    sortedAuthors: {
        type: Array,
        default: () => []
    },
    ignoreFileCallback: {
      type: Function
    },
    ignoreExtensionCallback: {
      type: Function
    },
    isIgnoredCallback: {
        type: Function
    },
  },
  computed: {
    authors: function () {
      let authors = [];
      let i = 0;
      this.sortedAuthors.forEach((author) => {
        let formatedAuthor = {name: author.email, children: [], commits: true, id: i};
        i += 1;
        author.details.forEach((commit) => {
          let formatedCommit = {id: i++, name: commit[1], children: commit[3].map((file) => ({id: i++, name: file.filepath, LoC:`LoC: ${file.added - file.deleted}`, children: [], repopath: commit[4]})), hash: commit[0]}
          formatedAuthor.children.push(formatedCommit);
        });
        i++;
        authors.push(formatedAuthor)
      })
      return authors
    }
  },
  methods: {
    openList: function (index, author) {
      this.overlay = true

      this.$nextTick(() => {
        document.getElementById([author.email.replace(/@|\./g, ''), index].join('_')).scrollIntoView(true);
      })

      this.activateCommit(index, author)
    },
    activateCommit: function (index, author) {
      this.activeNod = [author.email.replace(/@|\./g, ''), index].join('_')
    },
  },
}
</script>
<style scoped>
.author-list .v-list{
  height: 410px;
  overflow-y: auto;
  padding: 0;
}

.repository-list .v-list{
  height: 410px;
  overflow-y: auto;
}
.v-expansion-panel-content >>> .v-expansion-panel-content__wrap {
  padding: 0 !important;
}
.oddCommit {
  background-color: #f3f8ff;
}
.dialog-window {
  padding-top: 16px !important;
}
.tree-card {
  padding: 16px;
}
.close-icon {
  text-align:left;
  margin-right: 12px;
  margin-top:12px;
}
.close-box {
  float:right;
}
.ignored-files {
  text-decoration:line-through;
}
.ignore-ext-btn {
  padding: 8px !important;
  color: rgb(111, 111, 111);
}
.top-authors-toolbar {
  padding: 0px 16px;
}
.commit-info {
  min-height: 36px;
}
.blue-card {
  background-color: #1976d2 ;
  box-shadow: none !important;
}

.green-card {
  background-color: #00d0ff;
  box-shadow: none !important;
}

.red-card {
  background-color: #00d0ff;
  box-shadow: none !important;
}

.white--text {
  color: white;
}
.isActive {
  background-color: #1866c03d;
}
</style>