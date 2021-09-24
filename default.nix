let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/62659a81d9f2d25740c2b2f424b90f50a60eb80c.tar.gz";
    sha256 = "0zavwn8fw13k80cr9kn7ldcxd3ypbg07qxl43bdbhv70f3dbafim";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      rev = "a1206a694fe3b521440fe633db99a50b8255c1b2";
      sha256 = "0qdjjkqw3xlg8g686gvn509a9rv4kc6qfw07hypzc0fksix9d4iz";
      cargoSha256 = "sha256:175b76j31sls0gj08imchwnk7n4ylsxlc1bm58zrhfmq62hcchb1";
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
