<template>
  <div id="wrapper">
    <div id="range-select">
      <DatePicker
        :date-prop="date"
        :date-range="dateRange"
        @changeDate="onChangeDate"
      />
      <v-row justify="space-around">
        <v-col cols="3">
          <div class="repositories-input">
            <RepositoriesInput
              :repos="repos"
              @addRepository="addRepository"
              @removeRepository="removeRepository"
            />
          </div>
        </v-col>
        <v-col cols="3">
          <div class="analyze-button">
            <AnalysisList
              :analyses="analyses"
              @declineAll="declineAllAnalysis"
              @changeAnalize="chooseAnalysis"
              @declineOne="declineOne"
              @analize="analize"
              @changeTitle="changeAnalysisTitle"
              @isImpact="switchImpact"
              @isPersistence="switchPersistence"
            />
          </div>
          <div class="mt-2">
            <SaveConfiguration
              :analyses="analyses"
              @reloadStorage="reloadAnalysesStorage"
              @declineAll="declineAllAnalysis"
            />
          </div>
          <LoadConfiguration
            :stored-analyses="storedAnalyses"
            @selectAnalysis="selectAnalysis"
          />
        </v-col>
        <v-col cols="3" />
      </v-row>
      <v-row justify="space-around">
        <v-col cols="1">
          <h1>Results</h1>
        </v-col>
      </v-row>
      <Statistics
        :repos="repos"
        :sorted-authors="sortedAuthors"
        :ignore-file-callback="ignoreFile"
        :ignore-extension-callback="ignoreExtension"
        :is-ignored-callback="isIgnored"
      />
    </div>
    <v-divider class="mt-5" />
    <v-row>
      <v-col>
        <div class="mt-3">
          <v-card
            flat
            tile
          >
            <template>
              <v-tabs
                v-model="tab"
                align-with-title
              >
                <v-tabs-slider></v-tabs-slider>
                <v-tab
                  v-for="item in tabItems"
                  :key="item"
                >
                  {{ item }}
                </v-tab>
                <v-tab v-if="isImpact">
                  Impact
                </v-tab>
                <v-tab v-if="isPersistence">
                  Persistence of code
                </v-tab>
              </v-tabs>
            </template>
            <v-tabs-items v-model="tab">
              <v-tab-item>
                <v-card flat class="commit-chart-window">
                  <commits-and-code-chart
                    v-for="(repo, index) in rawData"
                    :key="index"
                    :repo="repo"
                    :dates="date"
                    @stopSpiner="isSpiner = false;"
                  />
                  <div v-if="isSpiner" class="chart-spiner">
                    <v-progress-circular
                      :size="70"
                      :width="7"
                      color="primary"
                      indeterminate
                    />
                  </div>
                  <DateChanger
                    :date="date"
                    :date-range="dateRange"
                    @changeDate="onChangeDate"
                    @analize="analize"
                  />
                </v-card>
              </v-tab-item>
              <v-tab-item>
                <v-card flat>
                  <FileExtensionsChart
                    v-if="!isSpinerExtensions"
                    :pieData="mainPieData"
                    @stopSpinerExtensions="isSpinerExtensions = false;"
                  />
                  <div v-if="isSpinerExtensions" class="chart-spiner">
                    <v-progress-circular
                      :size="70"
                      :width="7"
                      color="primary"
                      indeterminate
                    />
                  </div>
                </v-card>
              </v-tab-item>
              <v-tab-item v-if="isImpact">
                <v-card flat>
                  <ImpactCharts
                    :pieDatas="pieDatas"
                    :personalImpact="personalImpact"
                    :extensions="mainPieData"
                  />
                </v-card>
              </v-tab-item>
              <v-tab-item v-if="isPersistence">
                <v-card flat>
                  <PersistenceChart
                    @persistenceData="changePersistenceData"
                  />
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-card>
        </div>
      </v-col>
    </v-row>
    <v-spacer />
    <v-divider />
    <v-row class="mt-5">
      <v-col cols="6">
        <v-row>
          <v-col cols="md-8">
            <div class="select-repository">
              <v-select
                v-model="selectedRepoPath"
                :items="repos"
                label="Select repository"
                item-text="path"
                item-value="value"
              />
            </div>
          </v-col>
          <v-col cols="md-4">
            <div class="commits-count">
              <EditIgnores
                :repo="selectedRepoPath"
                :ignored-files="selectedIgnoredFiles"
                @ignores="onChangeIgnores"
              />
            </div>
          </v-col>
        </v-row>
        <div class="project-tree">
          <project-tree
            :items="selectedRepoTree"
            :active-file.sync="fileSelected"
            :open-file.sync="fileOpened"
            :is-ignored-callback="isIgnored"
            :stop-ignore-file-callback="stopIgnoreFile"
            :ignore-file-callback="ignoreFile"
          />
        </div>
      </v-col>
      <v-col cols="6">
        <FilePreview
          :file-preview="filePreview"
          :selected-file-name="selectedFileName"
          :last-commits="lastCommits"
        />
      </v-col>
    </v-row>
  </div>
</template>
<script>
/* eslint-disable */
import normalize from "normalize-path";
import minimatch from "minimatch";
import { mapMutations, mapActions, mapGetters } from "vuex";
import { Repository } from "~/models/repository";
import { Author } from "~/models/author";
import ProjectTree from "../components/ProjectTree.vue";
import CommitsAndCodeChart from "../components/CommitsAndCodeChart.vue";
import SaveConfiguration from "../components/SaveConfiguration.vue";
import DatePicker from "../components/DatePicker.vue";
import EditIgnores from "../components/EditIgnores.vue";
import Statistics from "../components/Statistics.vue";
import DateChanger from "../components/DateChanger.vue";
import LoadConfiguration from "../components/LoadConfiguration.vue";
import RepositoriesInput from "../components/RepositoriesInput.vue";
import FilePreview from "../components/FilePreview.vue";
import FileExtensionsChart from "../components/FileExtensionsChart.vue";
import AnalysisList from "../components/AnalysisList.vue";
import ImpactCharts from "../components/ImpactCharts.vue";
import PersistenceChart from "../components/PersistenceChart.vue";

export default {
  components: {
    ProjectTree,
    CommitsAndCodeChart,
    SaveConfiguration,
    DatePicker,
    EditIgnores,
    Statistics,
    DateChanger,
    LoadConfiguration,
    RepositoriesInput,
    SaveConfiguration,
    FilePreview,
    FileExtensionsChart,
    AnalysisList,
    ImpactCharts,
    PersistenceChart,
},
  data: () => ({
    filePreview: "",
    selectedFileName: "",
    selectedRepoPath: "",
    selectedRepoTree: [],
    fileSelected: [],
    fileOpened: [],
    date: [
      new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substring(0, 10),
      new Date(Date.now()).toISOString().substring(0, 10),
    ],
    authors: [],
    files: [],
    repos: [],
    rawData: [],
    lastCommits: [],
    isSpiner: false,
    windowLength: 2,
    windowOnboarding: 0,
    isSpinerExtensions: false,
    analyses: [],
    storedAnalyses: [],
    tab: null,
    tabItems: ['Commit and Code', 'Extensions',],
    isImpact: false,
    isPersistence: false,
  }),
  computed: {
    selectedIgnoredFiles: function () {
      if (this.selectedRepoPath && this.repos.find((x) => x.path == this.selectedRepoPath)) {
        return this.repos.find((x) => x.path == this.selectedRepoPath).ignoredFiles;
      }
      return [];
    },
    sortedAuthors: function () {
      var result = this.authors;
      result.sort(function (a, b) {
        if (a.lines.added - a.lines.deleted < b.lines.added - b.lines.deleted) {
          return 1;
        }
        if (a.lines.added - a.lines.deleted > b.lines.added - b.lines.deleted) {
          return -1;
        }
        return 0;
      });
      return result.length > 10 ? result.slice(0, 10) : result;
    },
    dateRange: function () {
      return this.date.join(" - ");
    },
    ignore: function () {
      if (this.repos.length > 0) {
        var ignoredFiles = this.repos.reduce(
          (p, c) => [...p, ...c.ignoredFiles],
          []
        );
        return ignoredFiles && ignoredFiles.length > 0
          ? ignoredFiles.join(", ")
          : [];
      }
    },
    impact: function () {
      return this.getImpact()
    },
    personalImpact: function () {
      return this.getPersonalImpact()
    },
    pieDatas: function () {
      return this.getPieDatas()
    },
    mainPieData: function () {
      return [['Type of files', 'Lines of code']].concat(this.getMainData())
    },
  },
  async mounted() {
    if (process.client) {
      this.isSpinerExtensions = true;
      if (localStorage.getItem("hasData")) {
        if (localStorage.getItem("date")) {
          this.date = JSON.parse(localStorage.getItem("date"));
        }
        if (localStorage.getItem("repos")) {
          this.repos = JSON.parse(localStorage.getItem("repos"));
          let repository = this.repos[0];
          const fileTree = await this.$axios.$get(
            `/tree?repo=${escape(repository.path)}`
          );
          this.selectedRepoPath = repository.path;
          this.selectedRepoTree = fileTree;
        }
        if (localStorage.getItem("rawData")) {
          this.rawData = JSON.parse(localStorage.getItem("rawData"));
        }
      } else {
        if (localStorage.getItem("repos")) {
          this.repos = JSON.parse(localStorage.getItem("repos"));
          this.analize();
        } else {
          this.repos.push(new Repository("", [], [], 0, 0));
        }
      }
      this.reloadAnalysesStorage();
      this.analize();
    }
  },
  async fetch() {},
  methods: {
    normalize: function (str) {
      str = normalize(str);
      return str;
    },
    ...mapMutations({
      updateRepoData: 'ExtensionsManager/updateRepoData'
    }),
    ...mapActions({
      reloadImpact: 'ExtensionsManager/reloadImpact'
    }),
    ...mapGetters({
      getImpact: 'ExtensionsManager/getImpact',
      getMainData: 'ExtensionsManager/getMainPieData',
      getPieDatas: 'ExtensionsManager/getPieDatas',
      getPersonalImpact: 'ExtensionsManager/getPersonalImpact'
    }),
    switchImpact: function (data) {
      this.isImpact = data.impact;
    },
    declineAllAnalysis: function () {
      this.analyses = [];
    },
    declineOne: function (number) {
      this.analyses.splice(number.index, 1)
    },
    changeAnalysisTitle: function (data) {
      this.analyses[data.idx].title = data.title
    },
    selectAnalysis: function (data) {
      this.date = data.date
      this.repos = data.repos.map((repo) => (new Repository(repo.path, repo.ignores, [], 0, 0)))
      this.analize()
      this.changeAnalysisTitle({idx: this.analyses.length - 1, title: data.title})
    },
    chooseAnalysis: function (analysisData) {
      const analysis = analysisData.analysis;
      this.repos = analysis.repos;
      this.authors = analysis.authors;
      this.rawData = analysis.rawData;
      this.date = analysis.date;
    },
    addRepository: function () {
      this.repos.push(new Repository("", [], [], 0, 0));
    },
    removeRepository: function (index) {
      this.repos.splice(index.index, 1);
    },
    reloadAnalysesStorage: function () {
      if (process.client) {
        this.storedAnalyses = []
        if (localStorage.getItem('analyses')) {
          this.storedAnalyses = JSON.parse(localStorage.getItem("analyses"))
        }
      }
    },
    analize: async function () {
      this.isSpiner = true;
      this.authors = [];
      this.rawData = [];
      let analysis = {rawData: [], authors: []}
      this.repos.forEach(async (repository) => {
        if (repository.path === "") {
          return;
        }
        let dates = "";
        if (this.date.length === 2) {
          dates = `&after=${this.date[0]}&before=${this.date[1]}`;
        }
        let ignore = "";

        if (repository.ignoredFiles.length > 0) {
          ignore = "&ignore=" + escape(repository.ignoredFiles.join(","));
        }
        const gitlog = await this.$axios.$get(
          `/gitlog?repo=${escape(repository.path)}${dates}${ignore}`
        );

        const rawData = await this.$axios.$get(
          `/gitlog?repo=${escape(repository.path)}${dates}${escape(
            ignore
          )}&raw=true`
        );

        analysis.rawData.push(rawData)
        this.rawData.push(rawData);
        const authors = [];
        for (const [key, value] of Object.entries(gitlog["authors"])) {
          if (this.authors.find((x) => x.email === key)) {
            let author = this.authors.find((x) => x.email === key);
            author.commits += value.commits;
            author.lines.added += value.lines.added;
            author.lines.deleted += value.lines.deleted;
            author.details = author.details.concat(value.details);
          } else {
            let newAuthor = new Author(key, null, value.commits, value.lines, value.details);
            authors.push(newAuthor);
            this.authors.push(newAuthor);
          }
        }

        const fileTree = await this.$axios.$get(
          `/tree?repo=${escape(repository.path)}`
        );
        repository.commits = gitlog.commits;
        repository.lines = gitlog.lines;
        repository.authors = authors;
        analysis.authors = analysis.authors.concat(authors.filter(author => !(analysis.authors.includes(author))))
      });
      
      analysis.repos = structuredClone(this.repos)
      analysis.date = this.date
      analysis.title = this.date.join(' ')
      this.analyses.push(analysis)

      if (this.repos.length > 0) {
        localStorage.repos = JSON.stringify(
          this.repos.map((repo) => {
            return {
              authors: repo.authors,
              commits: repo.commits,
              ignoredFiles: repo.ignoredFiles,
              lines: repo.lines,
              path: repo.path,
            };
          })
        );
        localStorage.date = JSON.stringify(this.date);
        localStorage.hasData = 1;

        if (!this.selectedRepoPath) {
          this.selectedRepoPath = this.repos[0].path
        }
      } else {
        localStorage.hasData = 0;
      }
    },
    ignoreFile: function (path, repositoryPath, isDirectory = false) {
      if (this.isIgnored(path, repositoryPath)) {
        return;
      }

      if (this.repos.find((x) => x.path === repositoryPath)) {
        let repo = this.repos.find((x) => x.path === repositoryPath);
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");

        if (isDirectory) {
          const dirPath = filePath + "/**";
          if (!repo.ignoredFiles.includes(dirPath)) {
            repo.ignoredFiles.push(dirPath);
          }
        }
        if (!repo.ignoredFiles.includes(filePath)) {
          repo.ignoredFiles.push(filePath);
        }
      }
    },
    ignoreExtension: function (repopath, ext) {
      if (this.repos.find((x) => x.path === repopath)) {
        let repo = this.repos.find((x) => x.path === repopath);
        repo.ignoredFiles.push(`*.${ext}`)
      }
    },
    isIgnored: function (path, repositoryPath) {
      path = normalize(path);
      repositoryPath = normalize(repositoryPath);
      let repo = this.repos.find((x) => x.path === repositoryPath);
      if (repo !== undefined) {
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");
        if (
          repo.ignoredFiles.find((x) =>
            minimatch(filePath, x, { matchBase: true })
          ) !== undefined
        ) {
          return 1;
        } else if (
          repo.ignoredFiles.find((x) => filePath.startsWith(x)) !== undefined
        ) {
          return 2;
        }
        return false;
      }
      return false;
    },
    stopIgnoreFile: function (path, repositoryPath, isDirectory = false) {
      if (!this.isIgnored(path, repositoryPath)) {
        return;
      }

      if (this.repos.find((x) => x.path === repositoryPath)) {
        let repo = this.repos.find((x) => x.path === repositoryPath);
        const filePath = path.replace(repositoryPath, "").replace(/^\/+/, "");

        if (isDirectory) {
          const dirPath = filePath + "/**";
          if (repo.ignoredFiles.includes(dirPath)) {
            repo.ignoredFiles = repo.ignoredFiles.filter((x) => x != dirPath);
          }
        }
        if (repo.ignoredFiles.includes(filePath)) {
          repo.ignoredFiles = repo.ignoredFiles.filter((x) => x != filePath);
        }
      }
    },
    switchPersistence: function (data) {
      this.isPersistence = data.persistance;
    },
    changePersistenceData: function (data) {
      console.log(`/survival?repo=${escape(this.selectedRepoPath)}&after=${data.after}&before=${data.before}&date=${data.date}`)
      // let persistance = this.$axios.$get(`/survival?repo=${escape(this.selectedRepoPath)}&after=${data.after}&before=${data.before}&date=${data.date}`)
    },
    onChangeIgnores: function (updatedIgnores) {
      const repo = this.repos.find((x) => x.path === updatedIgnores.repo);
      if (repo) {
        repo.ignoredFiles = updatedIgnores.files.filter((x) => x != "");
      }
    },
    onChangeDate: function (updatedDate) {
      this.date = updatedDate.date;
    },
  },
  watch: {
    fileSelected: async function (value) {
      this.selectedFileName = value[0];
      this.filePreview = await this.$axios.$get(`/file?file=${escape(value)}`);
      this.lastCommits = await this.$axios.$get(
          `/gitblame?file=${escape(this.fileSelected)}`
        );
    },
    selectedRepoPath: async function (value) {
      this.isSpinerExtensions = true;
      if (this.repos.find((x) => x.path === value)) {
        const repo = this.repos.find((x) => x.path === value);
        this.selectedRepoTree = await this.$axios.$get(
            `/tree?repo=${escape(repo.path)}`
        );
        this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
        this.reloadImpact()
        return;
      }

      for (path in this.repos) {
        const repo = this.repos.find((x) => x.path === path);
        if (repo) {
          this.selectedRepoPath = path;
          this.selectedRepoTree = await this.$axios.$get(
            `/tree?repo=${escape(repo.path)}`
          );
          this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
          this.reloadImpact()
          return;
        }
      }

      this.selectedRepoTree = [];
      this.selectedRepoPath = '';
      this.updateRepoData({repopath: this.selectedRepoPath, repotree: this.selectedRepoTree})
      this.reloadImpact()
    },
    repos: {
      handler(val, oldVal) {
        localStorage.repos = JSON.stringify(
          this.repos.map((repo) => {
            return {
              authors: repo.authors,
              commits: repo.commits,
              ignoredFiles: repo.ignoredFiles,
              lines: repo.lines,
              path: repo.path,
            };
          })
        );
      },
      deep: true,
    },
    mainPieData: function() {
      this.isSpinerExtensions = false;
    }
  },
};
</script>
<style scoped>
.project-tree {
  max-height: 500px;
  overflow-y: auto;
}
.commit-chart-window {
  height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}
.chart-spiner {
  margin: 0 auto;
  width: 70px;
}
</style>
