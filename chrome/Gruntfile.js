module.exports = function(grunt) {

  grunt.initConfig({
  pkg : grunt.file.readJSON('package.json'),
    
    less: {
      development: {
        options: {
          paths: ["extension/static/styles/"]
        },
        files: {
          "extension/static/styles/css/content-script.css": "extension/static/styles/less/content-script.less",
        }
      }
    },
   
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      app: {
        files: {
          'extension/static/styles/css/content-script.min.css': [
            'extension/static/styles/css/content-script.css'
          ],
        }
      },
    },


    watch: {
      options: {
        livereload: true,
      },
      less: {
        options: {
          livereload: false
        },
        files: ['extension/static/styles/less/*.less'],
        tasks: ['less', 'cssmin:app'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-notify');

  grunt.task.run('notify_hooks');
  
  grunt.registerTask('default', ['less', 'cssmin:app', 'watch']);

};