(function() {
  goog.provide('gn_inspire_editor');

  goog.require('gn');
  goog.require('inspire_contact_directive');
  goog.require('inspire_multilingual_text_directive');
  goog.require('inspire_get_shared_users_factory');
  goog.require('inspire_get_keywords_factory');
  goog.require('inspire_get_extents_factory');
  goog.require('inspire_date_picker_directive');

  goog.require('inspire_mock_full_metadata_factory');

  var module = angular.module('gn_inspire_editor',
    [ 'gn', 'inspire_contact_directive', 'inspire_multilingual_text_directive', 'inspire_metadata_factory',
      'inspire_get_shared_users_factory', 'inspire_get_keywords_factory', 'inspire_get_extents_factory',
      'inspire_date_picker_directive']);

  // Define the translation files to load
  module.constant('$LOCALES', ['core', 'editor', 'inspire']);

  module.config(['$translateProvider', '$LOCALES',
    function($translateProvider, $LOCALES) {
      $translateProvider.useLoader('localeLoader', {
        locales: $LOCALES,
        prefix: '../../catalog/locales/',
        suffix: '.json'
      });

      var lang = location.href.split('/')[5].substring(0, 2) || 'en';
      $translateProvider.preferredLanguage(lang);
      moment.lang(lang);
    }]);

  module.controller('GnInspireController', [
    '$scope', 'inspireMetadataLoader', 'inspireGetSharedUsersFactory', '$translate', '$http',
    function($scope, inspireMetadataLoader, inspireGetSharedUsersFactory, $translate, $http) {
      var allowUnload = false;
      window.onbeforeunload = function() {
        if (!allowUnload) {
          return $translate('beforeUnloadEditor');
        }
      };
      $scope.languages = ['ger', 'fre', 'ita', 'eng'];

      var params = window.location.search;
      var mdId = params.substring(params.indexOf("id=") + 3);
      var indexOfAmp = mdId.indexOf('&');
      if (indexOfAmp > -1) {
        mdId = mdId.substring(0, indexOfAmp);
      }
      $scope.mdId = mdId;
      inspireMetadataLoader($scope.url, mdId).then(function (data) {
        $scope.data = data;
      });

      $scope.$watch("data.language", function (newVal, oldVal) {
        var langs =  $scope.data.otherLanguages;
        var i = langs.indexOf(oldVal);
        if (i > -1) {
          langs.splice(i, 1);
        }
        if (langs.indexOf(newVal) < 0) {
          langs.push(newVal);
        }
      });
      $scope.$watchCollection("data.otherLanguages", function() {
        var langs =  $scope.data.otherLanguages;
        langs.sort(function(a,b) {
          if (a == $scope.data.language) {
            return -1;
          }
          if (b == $scope.data.language) {
            return 1;
          }
          return $scope.languages.indexOf(a) - $scope.languages.indexOf(b);
        });

      });
      $scope.isOtherLanguage = function (lang) {
        var langs =  $scope.data.otherLanguages;
        var i = 0;
        for (i = 0; i < langs.length; i++) {
          if (lang === langs[i]) {
            return true;
          }
        }
      };
      $scope.toggleLanguage = function (lang) {
        var langs =  $scope.data.otherLanguages;
        if (lang !== $scope.data.language) {
          var i = langs.indexOf(lang);
          if (i > -1) {
            langs.splice(i, 1);
          } else {
            langs.push(lang);
          }
        }
      };

      $scope.editContact = function(title, contact) {
        $scope.contactUnderEdit = contact;
        $scope.contactUnderEdit.title = title;
        $scope.selectedSharedUser = {};
        var modal = $('#editContactModal');
        modal.modal('show');
      };
      $scope.deleteFromArray = function(model, elemToRemove) {
        var i = model.indexOf(elemToRemove);
        if (i > -1) {
          model.splice(i, 1);
        }
      };

      $scope.saveMetadata = function(editTab) {
        return $http({
          method: 'POST',
          url: $scope.url + "inspire.edit.save?id=" + mdId,
          params: {id: mdId, data: $scope.data}
        }).success(function (data, status, headers, config, statusText) {
          if (editTab) {
            allowUnload = true;
            window.location.href = 'metadata.edit?id=' + mdId + '&currTab=' + editTab;
          }
        }).error(function (data) {
          alert($translate("saveError")  + data);
        });
      };

      $scope.stopEditing = function() {
        allowUnload = true;
        window.location.href = 'metadata.show?id=' + mdId;
      };

      $scope.saveMetadataAndExit = function (){
        $scope.saveMetadata().success(function(){
          $scope.stopEditing();
        });
      };

      $scope.updateCategory = function(index, selectId) {
        if (index > -1) {
          var categories = $scope.data.identification.topicCategory;
          var newCategory = $scope.data.topicCategoryOptions[$('#' + selectId).val()];
          categories[index] = newCategory;
        }
      };
  }]);


  module.controller('InspireKeywordController', [
    '$scope', 'inspireGetKeywordsFactory',
    function($scope, inspireGetKeywordsFactory) {
      $scope.editKeyword = function(keyword) {
        $scope.keywordUnderEdit = keyword;
        $scope.selectedKeyword = {};
        var modal = $('#editKeywordModal');
        modal.modal('show');
      };
      $scope.deleteKeyword = function(keyword) {
        var keywords = $scope.data.identification.descriptiveKeywords;
        keywords.splice(keywords.indexOf(keyword), 1);
      };

      $scope.keywords = {
        data: {},
        service: {}
      };
      inspireGetKeywordsFactory($scope.url, 'external.theme.inspire-theme').then (function (keywords) {
        $scope.keywords.data = keywords;
      });
      inspireGetKeywordsFactory($scope.url, 'external.theme.inspire-service-taxonomy').then (function (keywords) {
        $scope.keywords.service = keywords;
      });

      $scope.selectKeyword = function(keyword) {
        $scope.selectedKeyword = keyword;
      };

      $scope.linkToOtherKeyword = function() {
        var keyword = $scope.selectedKeyword;
        $scope.keywordUnderEdit.uri = keyword.uri;
        $scope.keywordUnderEdit.words = keyword.words;
        var modal = $('#editKeywordModal');
        modal.modal('hide');
      }
    }]);


  module.controller('InspireExtentController', [
    '$scope', 'inspireGetExtentsFactory',
    function($scope, inspireGetExtentsFactory) {

      $scope.extentImgSrc = function (width, extent) {
        return $scope.url + 'region.getmap.png?mapsrs=EPSG:21781&background=geocat&width=' + width + '&id=' + extent.geom;
      };
      $scope.editExtent = function(extent) {
        $scope.extentUnderEdit = extent;
        $scope.selectedExtent = {};
        var modal = $('#editExtentModal');
        modal.modal('show');
      };

      $scope.selectExtent = function (extent) {
        $scope.selectedExtent = extent;
      };

      $scope.searchExtents = function (query) {
        inspireGetExtentsFactory($scope.url, query).then (function (extents){
          $scope.extents = extents;
        });

        $scope.linkToOtherExtent = function () {
          $scope.extentUnderEdit.geom = $scope.selectedExtent.geom;
          $scope.extentUnderEdit.description = $scope.selectedExtent.description;
          var modal = $('#editExtentModal');
          modal.modal('hide');
        };

      }
    }]);

  module.controller('InspireConstraintsController', [
    '$scope','$translate', function($scope, $translate) {
      $scope.$watch('data.constraints.legal', function(newValue) {
        if (newValue.length == 0) {
          newValue.push({
            accessConstraint: 'copyright',
            useConstraint: 'copyright',
            otherConstraints: [],
            legislationConstraints: []
          });
        }
      });
      $scope.addOtherConstraintIfRequired = function(legalConstraint) {
        if (legalConstraint.accessConstraint === 'otherRestrictions' && legalConstraint.otherConstraints.length == 0) {
          var otherConstraint = {};
          otherConstraint[$scope.data.language] = '';
          legalConstraint.otherConstraints.push(otherConstraint);
        } else if (legalConstraint.accessConstraint !== 'otherRestrictions') {
          var toRemove = [];
          for (var i = 0; i < legalConstraint.otherConstraints.length; i++) {
            var otherConstraint = legalConstraint.otherConstraints[i];
            var remove = otherConstraint[$scope.data.language].trim().length == 0;
            for (var j = 0; j < $scope.data.otherLanguages.length; j++) {
              var lang = $scope.data[j];
              if (otherConstraint[$scope.data.language].trim().length == 0) {
                remove = false;
                break;
              }
            }

            if (remove) {
              toRemove.push(otherConstraint);
            }
          }

          for (var i = 0; i < toRemove.length; i++) {
            $scope.deleteFromArray(legalConstraint.otherConstraints, toRemove[i])
          }
        }
      };
      $scope.$watchCollection('data.constraints.legal', function(newValue) {
        for (var i = 0; i < newValue.length; i++) {
          $scope.addOtherConstraintIfRequired(newValue[i]);
        }
      });


}]);


})();