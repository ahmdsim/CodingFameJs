<template>
  <v-row justify="space-around">
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
          <v-card height="700px" class="tree-card">
            <v-card-text max-height="600px">
              <div>
                <div class="close-icon">
                  <v-icon class="close-box" @click="overlay=false">
                    mdi-close-box
                  </v-icon>
                </div>
                <v-treeview
                  v-if="authors.length > 0"
                  :items="authors"
                  item-key="id"
                  :active="activeNod"
                  :open="activeNod"
                  open-on-click
                  hoverable
                  dense
                  transition
                  activatable
                >
                  <template #prepend="{ item }">
                    <v-icon v-if="item.hash">
                      mdi-source-commit
                    </v-icon>
                    <v-icon v-else-if="item.commits">
                      mdi-account
                    </v-icon>
                    <v-icon v-else>
                      mdi-file-document
                    </v-icon>
                  </template>
                  <template #label="{ item }">
                    <div v-if="item.hash" :id="[item.email.replace(/@|\./g, ''), item.index].join('_')"></div>
                    <div v-if="item.hash || item.commits">
                      {{ item.name }}
                    </div>
                    <div v-else>
                      <span v-if="isIgnoredCallback(item.name, item.repopath)" class="ignored-files">{{ item.name }}</span>
                      <span v-else>{{ item.name }}</span>
                    </div>
                  </template>
                  <template #append="{ item }">
                    <div v-if="!item.hash && !item.commits">
                      {{ item.LoC }}
                      <v-icon @click="ignoreFileCallback(item.repopath + '/' + item.name, item.repopath)">
                        mdi-file-document-remove
                      </v-icon>
                      <v-icon @click="ignoreFileCallback(item.repopath + '/' + item.name.split('/').slice(0, -1).join(`/`), item.repopath, true)">
                        mdi-folder-remove
                      </v-icon>
                      <v-btn text class="ignore-ext-btn" @click="ignoreExtensionCallback(item.repopath, item.name.split('.').pop())">
                        .ext
                      </v-btn>
                    </div>
                  </template>
                </v-treeview>
              </div>
            </v-card-text>
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
                @click="activateCommit(index, author);"
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
        let j = 0;
        author.details.forEach((commit) => {
          let formatedCommit = {id: i++, name: commit[1], children: commit[3].map((file) => ({id: i++, name: file.filepath, LoC:`LoC: ${file.added - file.deleted}`, children: [], repopath: commit[4]})), hash: commit[0], email: formatedAuthor.name, index: j++}
          formatedAuthor.children.push(formatedCommit);
        });
        i++;
        authors.push(formatedAuthor)
      })
      return authors
    }
  },
  methods: {
    activateCommit: function (index, author) {
      this.overlay = true
      this.activeNod = [this.authors.find((auth) => auth.name == author.email).id, this.authors.find((auth) => auth.name == author.email).children[index].id]
      this.$nextTick(() => {
        document.getElementById([author.email.replace(/@|\./g, ''), index].join('_')).scrollIntoView(true);
      })
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