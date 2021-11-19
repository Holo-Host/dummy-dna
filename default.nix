let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/d453dde541d48db2a03a0250170cb4160f2cb880.tar.gz";
    sha256 = "1hdap7cx5x2gjb837dnnqifngb7spqx94vrc778jsad014kfj9bc";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      # Holochain v0.0.116
      rev = "c40fc5beb86be3af14bdf28f8554363e1c52cb2f";
      sha256 = "07vmg5sr0np6jds4xmjyj5nns83l56qhy75f6c8z09b7hh55bn2l";
      cargoSha256 = "1y3lq58684zn18s4ya9v9y7513cm4d1wpvwa2kvh08jn0awyw5pp";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };
      lairKeystoreHashes = {
        sha256 = "06vd1147323yhznf8qyhachcn6fs206h0c0bsx4npdc63p3a4m42";
        cargoSha256 = "0brgy77kx797pjnjhvxhzjv9cjywdi4l4i3mdpqx3kyrklavggcy";
      };
    };


  };
in holonix.main
