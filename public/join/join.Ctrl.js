(function() {
  'use strict';

  angular
    .module('app')
    .controller('JoinCtrl', JoinCtrl);

  JoinCtrl.$inject = ['$location', '$scope', '$localStorage', 'socket'];

  function JoinCtrl($location, $scope, $localStorage, socket) {
    $scope.clientId = 'ahmet.cavus@fikirdek.com';
    $scope.secretId = 'testtest';
    $scope.channelId = 'collect';
    $scope.token = '';
    $scope.info = 'Info Panel';
    var account;

    $scope.join = function() {
        $.post('/auth', {
            clientId: $scope.clientId,
            secretId: $scope.secretId,
            channelId: $scope.channelId
        }).done(function(result) {
            $scope.token = result.token;
            $scope.info = $scope.token;
            $.ajax({
                url: '/robotrain',
                method: 'POST',
                data: {
                    token: $scope.token,
                    channelId: $scope.channelId
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', 'Basic Q29sbGVjdElPLUdyYW50LUFjY2VzczpjTDRDMjVjbC4=');
                },
                success: function(result) {
                    $scope.info = JSON.stringify(result);
                    socket.connect($scope.token, $scope.channelId);
                    socket.on('connect', onSocketConnected);
                    socket.on('disconnect', onSocketDisconnected);
                    socket.on('error', onSocketError);
                    account = parseJwt($scope.token);
                    $localStorage.account = account;
                },
                error: function(err) {
                    $scope.info = err.responseText;
                }

            });
        });
    };

    function onSocketConnected() {
        $scope.info = 'authenticated';
        $location.path('/main');
    }

    function onSocketDisconnected() {
        $scope.info = 'disconnected';
    }

    function onSocketError(err) {
        $scope.info = err;
    }

    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    }

  }

})();
