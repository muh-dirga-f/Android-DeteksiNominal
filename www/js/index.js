/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener("deviceready", this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function () {
    app.receivedEvent("deviceready");
  },
  // Update DOM on a Received Event
  receivedEvent: function (id) {
    setTimeout(() => {
      this.onPlay();
      $.ajax({
        type: "GET",
        url: "https://raw.githubusercontent.com/muh-dirga-f/Android-DeteksiNominal/main/url.json",
        dataType: "text",
        success: function (response) {
          app.url = JSON.parse(response).url;
        },
      });
    }, 500);
    $(".navbar")
      .children()
      .on("click", function () {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
      });
    $(".navbar").on("click", ".play", function () {
      app.onPlay();
    });
    $(".navbar").on("click", ".stop", function () {
      app.onStop();
    });
    $("#send").on("click", function () {
      this.sendAjax();
    });
    document.getElementById("speak").addEventListener(
      "click",
      function () {
        this.speak();
      }.bind(this),
      false
    );

    if (window.plugin.CanvasCamera) {
      window.plugin.CanvasCamera.initialize({
        fullsize: window.document.getElementById("fullsize"),
        // thumbnail: window.document.getElementById("thumbnail"),
      });
    }
  },
  isPlay: true,
  onPlay: function () {
    console.log("play");
    app.isPlay = false;
    $("#play").text("Stop");
    $("#play").removeClass("stop play");
    $("#play").addClass("stop");
    setTimeout(() => {
      app.sendAjax();
    }, 10000);
    if (window.plugin.CanvasCamera) {
      var options = {
        canvas: {
          width: 480,
          height: 320,
        },
        capture: {
          width: 480,
          height: 320,
        },
        use: "data",
        fps: 1,
        flashMode: false,
        hasThumbnail: false,
        thumbnailRatio: 1 / 6,
        cameraFacing: "back",
      };
      window.plugin.CanvasCamera.start(
        options,
        function (error) {
          // console.log("[CanvasCamera start]", "error", error);
        },
        function (data) {
          // console.log("[CanvasCamera start]", "data", data);
        }
      );
    }
  },
  onStop: function () {
    console.log("stop");
    app.isPlay = true;
    $("#play").text("Play");
    $("#play").removeClass("stop play");
    $("#play").addClass("play");
    if (window.plugin.CanvasCamera) {
      window.plugin.CanvasCamera.stop(
        function (error) {
          // console.log("[CanvasCamera stop]", "error", error);
        },
        function (data) {
          // console.log("[CanvasCamera stop]", "data", data);
        }
      );
    }
  },
  url: "",
  isSend: false,
  sendAjax: async function () {
    if (app.isSend == false) {
      app.isSend = true;
      app.onStop();
      $("#hasil").text("0");
      // let url = "https://amanda-publicity-tells-dropped.trycloudflare.com/";
      // let url = "http://192.168.49.5:5000";
      let canvas = window.document.getElementById("fullsize");
      let dataURL = canvas.toDataURL();
      dataURL = await reduce_image_file_size(dataURL);
      dataURL = dataURL.replace("data:image/png;base64,", "");
      let fd = {
        image: dataURL,
      };
      async function reduce_image_file_size(
        base64Str,
        MAX_WIDTH = 450,
        MAX_HEIGHT = 450
      ) {
        let resized_base64 = await new Promise((resolve) => {
          let img = new Image();
          img.src = base64Str;
          img.onload = () => {
            let canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL()); // this will return base64 image results after resize
          };
        });
        return resized_base64;
      }
      console.log("send AJAX");
      // console.log(dataURL);
      setTimeout(() => {
        $.ajax({
          type: "POST",
          url: app.url + "/process_image",
          data: JSON.stringify(fd),
          contentType: "application/json",
          success: function (response) {
            app.isSend = false;
            console.log(response);
            if (response.result.length > 0) {
              $("#hasil").text(response.result[0].nominal);
              TTS.speak({
                text:
                  "uang yang terdeteksi adalah uang " +
                  response.result[0].nominal,
                locale: "id-ID",
              });
            } else {
              app.onPlay();
              $("#hasil").text("0");
              TTS.speak({
                text: "nominal tidak terdeteksi, coba lagi",
                locale: "id-ID",
              });
              setTimeout(() => {
                app.sendAjax();
              }, 10000);
            }
          },
        });
      }, 100);
    }
  },
  speak: function () {
    TTS.speak({
      text: "uang yang terdeteksi adalah uang " + $("#hasil").text(),
      locale: "id-ID",
    });
  },
};

app.initialize();
