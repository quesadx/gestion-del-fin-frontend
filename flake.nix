{
  description = "Gestión del Fin - Frontend Development Environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node
            nodejs
            pnpm

            # TypeScript
            typescript
            typescript-language-server

            # Calidad de código
            eslint
            prettier
            cspell

            # Dependencias para Playwright / Chromium
            glib
            gtk3
            cairo
            pango
            atk

            dbus
            alsa-lib

            nss
            nspr

            fontconfig
            freetype

            libdrm
            mesa

            xorg.libX11
            xorg.libXcomposite
            xorg.libXcursor
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXi
            xorg.libXrandr
            xorg.libXrender
            xorg.libxcb
          ];

          shellHook = ''
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🧟 GESTIÓN DEL FIN - AMBIENTE FRONTEND (NIX) 🧟"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Node: $(node --version) | NPM: $(npm --version)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            # Alias automáticos para ahorrar tiempo
            alias pi="pnpm install"
            alias pd="pnpm dev"
            alias pb="pnpm build"
            alias pc="pnpm check"
          '';
        };
      }
    );
}
