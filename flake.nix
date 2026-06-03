{
  description = "Gestión del Fin - Frontend Development Environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs
              typescript
              typescript-language-server
              eslint
              prettier
              cspell
              pnpm
              chromium
            ];

            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";

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
    };
}
