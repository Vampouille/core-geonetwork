(function() {
  goog.provide('gn_wps_service');




  goog.require('OWS_1_1_0');
  goog.require('WPS_1_0_0');
  goog.require('XLink_1_0');

  var module = angular.module('gn_wps_service', []);

  // WPS Client
  // Jsonix wrapper to read or write WPS response or request
  var context = new Jsonix.Context(
      [XLink_1_0, OWS_1_1_0, WPS_1_0_0],
      {
        namespacePrefixes: {
          'http://www.w3.org/1999/xlink': 'xlink',
          'http://www.opengis.net/ows/1.1': 'ows',
          'http://www.opengis.net/wps/1.0.0': 'wps'
        }
      }
      );
  var unmarshaller = context.createUnmarshaller();
  var marshaller = context.createMarshaller();

  /**
   * @ngdoc service
   * @kind function
   * @name gn_viewer.service:gnWpsService
   * @requires $http
   * @requires gnOwsCapabilities
   * @requires gnUrlUtils
   * @requires gnGlobalSettings
   * @requires $q
   *
   * @description
   * The `gnWpsService` service provides methods to call WPS request and
   * manage WPS responses.
   */
  module.service('gnWpsService', [
    '$http',
    'gnOwsCapabilities',
    'gnUrlUtils',
    'gnGlobalSettings',
    '$q',
    function($http, gnOwsCapabilities, gnUrlUtils, gnGlobalSettings, $q) {

      this.proxyUrl = function(url) {
        return gnGlobalSettings.proxyUrl + encodeURIComponent(url);
      };

      /**
       * @ngdoc method
       * @methodOf gn_viewer.service:gnWpsService
       * @name gnWpsService#describeProcess
       *
       * @description
       * Call a WPS describeProcess request and parse the XML response, to
       * returns it as an object.
       *
       * @param {string} uri of the wps service
       * @param {string} processId of the process
       */
      this.describeProcess = function(uri, processId) {
        url = gnOwsCapabilities.mergeDefaultParams(uri, {
          service: 'WPS',
          version: '1.0.0',
          request: 'DescribeProcess',
          identifier: processId
        });

        //send request and decode result
        if (gnUrlUtils.isValid(url)) {
          var defer = $q.defer();

          var proxyUrl = this.proxyUrl(url);
          $http.get(proxyUrl, {
            cache: true
          }).then(
              function(data) {
                var response = unmarshaller.unmarshalString(data.data).value;
                defer.resolve(response);
              },
              function(data) {
                defer.reject(data);
              }
          );

          return defer.promise;
        }
      };

      /**
       * @ngdoc method
       * @methodOf gn_viewer.service:gnWpsService
       * @name gnWpsService#execute
       *
       * @description
       * Call a WPS execute request and manage response. The request is called
       * by POST with an OGX XML content built from parameters.
       *
       * @param {string} uri of the wps service
       * @param {string} processId of the process
       * @param {Object} inputs of the process
       * @param {Object} output of the process
       * @param {Object} options such as storeExecuteResponse, lineage and status
       */
      this.execute = function(uri, processId, inputs, responseDocument) {
        var defer = $q.defer();

        var me = this;

        this.describeProcess(uri, processId).then(
            function(data) {
              var description = data.processDescription[0];

              var url = me.proxyUrl(uri);
              var request = {
                name: {
                  localPart: 'Execute',
                  namespaceURI: 'http://www.opengis.net/wps/1.0.0'
                },
                value: {
                  service: 'WPS',
                  version: '1.0.0',
                  identifier: {
                    value: description.identifier.value
                  },
                  dataInputs: {
                    input: []
                  }
                }
              };

              var setInputData = function(input, data) {
                if (input.literalData) {
                  request.value.dataInputs.input.push({
                    identifier: {
                      value: input.identifier.value
                    },
                    data: {
                      literalData: {
                        value: data.toString()
                      }
                    }
                  });
                }
                if (input.boundingBoxData) {
                  var bbox = data.split(',');
                  request.value.dataInputs.input.push({
                    identifier: {
                      value: input.identifier.value
                    },
                    data: {
                      boundingBoxData: {
                        dimensions: 2,
                        lowerCorner: [bbox[0], bbox[1]],
                        upperCorner: [bbox[2], bbox[3]]
                      }
                    }
                  });
                }
              };

              for (i = 0, ii = description.dataInputs.input.length;
                   i < ii; ++i) {
                input = description.dataInputs.input[i];
                if (inputs[input.identifier.value] !== undefined) {
                  setInputData(input, inputs[input.identifier.value]);
                }
              }

              request.value.responseForm = {
                responseDocument: $.extend(true, {
                    lineage: false,
                    storeExecuteResponse: true,
                    status: false
                  }, responseDocument)
              };

              var body = marshaller.marshalString(request);
              body = body.replace(/dimensions/,
                  'xmlns:ows="http://www.opengis.net/ows/1.1" ows:dimensions');

              $http.post(url, body, {
                headers: {'Content-Type': 'application/xml'}
              }).then(
                  function(data) {
                    var response =
                        unmarshaller.unmarshalString(data.data).value;
                    defer.resolve(response);
                  },
                  function(data) {
                    defer.reject(data);
                  }
              );

            },
            function(data) {
              defer.reject(data);
            }
        );

        return defer.promise;
      };

      /**
       * @ngdoc method
       * @methodOf gn_viewer.service:gnWpsService
       * @name gnWpsService#getStatus
       *
       * @description
       * Get prosess status during execution.
       *
       * @param {string} url of status document
       */
      this.getStatus = function(url) {
          var defer = $q.defer();

          var proxyUrl = this.proxyUrl(url);
          $http.get(proxyUrl, {
            cache: true
          }).then(
              function(data) {
                var response = unmarshaller.unmarshalString(data.data).value;
                defer.resolve(response);
              },
              function(data) {
                defer.reject(data);
              }
          );

          return defer.promise;
      };
    }
  ]);
})();
