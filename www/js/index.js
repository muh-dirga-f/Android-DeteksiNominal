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
    }, 1000);
    document.getElementById("play").addEventListener(
      "click",
      function () {
        this.onPlay();
      }.bind(this),
      false
    );
    document.getElementById("stop").addEventListener(
      "click",
      function () {
        this.onStop();
      }.bind(this),
      false
    );
    document.getElementById("send").addEventListener(
      "click",
      function () {
        this.sendAjax();
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
  onPlay: function () {
    console.log("play");
    // let screenWidth = window.screen.width * window.devicePixelRatio;
    // let screenHeight = window.screen.height * window.devicePixelRatio;
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
  sendAjax: async function () {
    let urlApi = "https://ur-tests-waterproof-indeed.trycloudflare.com";
    // let urlApi = "http://192.168.49.5:5000";
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
        url: urlApi + "/process_image",
        data: JSON.stringify(fd),
        contentType: "application/json",
        success: function (response) {
          console.log(response);
          if (response.result.length > 0) {
            $("#hasil").text(response.result[0].nominal);
            TTS.speak({
              text: response.result[0].nominal,
              locale: "id-ID",
            });
          }
        },
      });
    }, 100);
  },
};

app.initialize();

// function dataURLtoBlob(dataURL) {
//   let array, binary, i, len;
//   binary = atob(dataURL.split(",")[1]);
//   array = [];
//   i = 0;
//   len = binary.length;
//   while (i < len) {
//     array.push(binary.charCodeAt(i));
//     i++;
//   }
//   return new Blob([new Uint8Array(array)], {
//     type: "image/png",
//   });
// }

// const canvas = $("#fullsize")[0];
// const file = dataURLtoBlob(canvas.toDataURL());
// let fd = new FormData();
// fd.append("image", file);
// setInterval(() => {
//   // alert("send AJAX");const fd = new FormData;
//   console.log(file);

//   $.ajax({
//     type: "POST",
//     url: urlApi + "/uang_matching",
//     data: fd,
//     processData: false,
//     contentType: false,
//     success: function (response) {
//       console.log(response);
//     },
//   });
// }, 5000);

// setInterval(async () => {}, 10000);
