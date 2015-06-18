angular.module('orbitumApp', [])
.controller('OperatorsController', ['$scope', '$http', '$q', '$interval',
    function ($scope, $http, $q, $interval) {
        var url = 'http://ext.orbitum.com/json_app.php';

        $scope.isLoading = 0;
        $scope.operators = {};
        $scope.operatorsCount = 0;
        $scope.errors = {};

        $scope.getOperators = function () {

            $scope.isLoading++;
            $http.get(url, {params: {act: 'getOperatorCnt'}})
                .success(function (response) {
                    $scope.operatorsCount = response.result;
                    for (var i=1; i<response.result+1; i++) {
                        $scope.operators[i] = {id: i};
                    }
                })
                .error(function () {
                    window.alert('Не удалось получить текущих операторов!');
                })
                .finally(function () {
                    $scope.isLoading--;
                });
        };

        $scope.getDataAsync = function () {
            var promises = [];

            angular.forEach($scope.operators, function (operator, key, obj) {
                $scope.isLoading++;
                promises.push($http.get(url, {params: {act: 'getValue', operator: key}}));
            });

            $q.all(promises).then(function(dataArray) {
                dataArray.forEach(function (current, index, array) {
                    var operatorId = current.config.params.operator;
                    $scope.operators[operatorId] = {id: operatorId, value: current.data.value};
                    $scope.isLoading--;
                });
            }, console.warn);
        };

        $scope.getDataSync = function () {
            var deferred = $q.defer();

            deferred.resolve();

            Object.keys($scope.operators).reduce(function (lastPromise, operatorKey) {
                return lastPromise.then(function () {
                    $scope.isLoading++;
                    return $http.get(url, {params: {act: 'getValue', operator: operatorKey}}).success(function (data) {
                        $scope.isLoading--;
                        $scope.operators[operatorKey].value = data.value;
                    });
                })
            }, deferred.promise);
        };

        $scope.setValue = function (operator) {
            $scope.isLoading++;
            $http.get(url, {params: {
                act: 'setValue',
                value: $scope.operators[operator].value,
                operator: operator
            }})
            .success(function (response) {
                if (response.result === true) {
                    delete $scope.errors[operator];
                    delete $scope.operators[operator];
                    $scope.operatorsCount--;
                } else {
                    $scope.errors[operator] = true;

                    $interval(function () {
                        delete $scope.errors[operator];
                    }, 1000);
                }
            })
            .error(function (err) {})
            .finally(function () {
                $scope.isLoading--;
            });
        };

    }
]);
