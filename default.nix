let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/62659a81d9f2d25740c2b2f424b90f50a60eb80c.tar.gz";
    sha256 = "0zavwn8fw13k80cr9kn7ldcxd3ypbg07qxl43bdbhv70f3dbafim";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      rev = "807b27eb991dfaa0c763a6d33bb53d3fc1b15023";
      sha256 = "1mlajxnakm8gjhk61vjvbrl1wibx0nq05sfcrdixrvgvxwb02x30";
      cargoSha256 = "sha256:0bxflwmdh785c99cjgpmynd0h70a5gm40pryzzrfd9xiypr29gi7";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };
      lairKeystoreHashes = {
        sha256 = "0khg5w5fgdp1sg22vqyzsb2ri7znbxiwl7vr2zx6bwn744wy2cyv";
        cargoSha256 = "1lm8vrxh7fw7gcir9lq85frfd0rdcca9p7883nikjfbn21ac4sn4";
      };
    };


  };
in holonix.main
