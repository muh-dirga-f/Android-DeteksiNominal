var app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },
  bindEvents: function () {
    document.addEventListener("deviceready", this.onDeviceReady, false);
  },
  onDeviceReady: function () {
    app.receivedEvent("deviceready");
  },
  receivedEvent: function (id) {
    setTimeout(() => {
      this.onPlay();
    }, 500);
    $(".navbar").on("click", ".play", function () {
      app.onPlay();
    });
    $(".navbar").on("click", ".stop", function () {
      app.onStop();
    });
    $("#send").on("click", function () {
      app.sendAjax();
    });
    $("#speak").on("click", function () {
      app.speak();
    });

    if (window.plugin.CanvasCamera) {
      window.plugin.CanvasCamera.initialize({
        fullsize: window.document.getElementById("fullsize"),
      });
    }
  },
  url: "",
  isPlay: true,
  isSend: false,
  onPlay: function () {
    console.log("play");
    app.isPlay = false;
    $("#play img").prop("src", "assets/stop-outline.svg");
    $("#play").removeClass("stop play");
    $("#play").addClass("stop");
    setTimeout(() => {
      app.sendAjax();
    }, 10000);
    if (window.plugin.CanvasCamera) {
      var options = {
        canvas: {
          width: 480,
          height: 720,
        },
        capture: {
          width: 480,
          height: 720,
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
    $("#play img").prop("src", "assets/play-outline.svg");
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
  sendAjax: async function () {
    if (app.isSend == false) {
      app.isSend = true;
      app.onStop();
      $("#hasil").text("0");
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
            resolve(canvas.toDataURL());
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

            let highest_score = 0;
            let highest_nominal = "";

            response.result.forEach((item) => {
              if (item.match_score > highest_score) {
                highest_score = item.match_score;
                highest_nominal = item.nominal;
              }
            });

            highest_nominal = highest_nominal.slice(0, -2); //disable if debug mode

            if (response.result.length > 0) {
              $("#hasil").text(highest_nominal);
              TTS.speak({
                text: "uang yang terdeteksi adalah uang " + highest_nominal,
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
              }, 15000);
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
