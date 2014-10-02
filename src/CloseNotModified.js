/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define */

define(function (require, exports) {
    "use strict";

    var DocumentManager = brackets.getModule("document/DocumentManager"),
        FileSystem      = brackets.getModule("filesystem/FileSystem"),
        MainViewManager = brackets.getModule("view/MainViewManager");

    var Events        = require("src/Events"),
        EventEmitter  = require("src/EventEmitter"),
        Git           = require("src/git/Git"),
        Utils         = require("src/Utils"),
        Strings       = require("strings");

    var $icon = $(null);

    function handleCloseNotModified(event) {
        var reopenModified = false;
        if (event.shiftKey) {
            reopenModified = true;
        }

        Git.status().then(function (modifiedFiles) {
            var openFiles   = MainViewManager.getWorkingSet(MainViewManager.ALL_PANES),
                projectRoot = Utils.getProjectRoot();

            openFiles.forEach(function (openFile) {
                var removeOpenFile = true;
                modifiedFiles.forEach(function (modifiedFile) {
                    if (projectRoot + modifiedFile.file === openFile.fullPath) {
                        removeOpenFile = false;
                        modifiedFile.isOpen = true;
                    }
                });

                if (removeOpenFile) {
                    // check if file doesn't have any unsaved changes
                    var doc = DocumentManager.getOpenDocumentForPath(openFile.fullPath);
                    if (doc && doc.isDirty) {
                        removeOpenFile = false;
                    }
                }

                if (removeOpenFile && !reopenModified) {
                    MainViewManager._close(MainViewManager.ALL_PANES, openFile);
                }
            });

            if (reopenModified) {
                var filesToReopen = modifiedFiles.filter(function (modifiedFile) {
                    return !modifiedFile.isOpen;
                });
                filesToReopen.forEach(function (fileObj) {
                    var fileEntry = FileSystem.getFileForPath(projectRoot + fileObj.file);
                    MainViewManager.addToWorkingSet(MainViewManager.ACTIVE_PANE, fileEntry);
                });
            }

            MainViewManager.focusActivePane();
        });
    }

    function init() {
        // Add close not modified button near working files list
        $icon = $("<div/>")
            .addClass("git-close-not-modified btn-alt-quiet")
            .attr("title", Strings.TOOLTIP_CLOSE_NOT_MODIFIED)
            .html("<i class='octicon octicon-remove-close'></i>")
            .on("click", handleCloseNotModified)
            .appendTo("#sidebar");
    }

    EventEmitter.on(Events.GIT_ENABLED, function () {
        $icon.show();
    });

    EventEmitter.on(Events.GIT_DISABLED, function () {
        $icon.hide();
    });

    // Public API
    exports.init = init;
});
