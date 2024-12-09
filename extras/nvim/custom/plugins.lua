local plugins = {
  {
    "rcarriga/nvim-dap-ui",
    dependencies={
      "mfussenegger/nvim-dap",
      "nvim-neotest/nvim-nio",
    },
    config = function ()
      local dap, dapui = require("dap"), require("dapui")
      dap.listeners.before.attach.dapui_config = function()
        dapui.open()
      end
      dap.listeners.before.launch.dapui_config = function()
        dapui.open()
       end
      dap.listeners.before.event_terminated.dapui_config = function()
        dapui.close()
      end
      dap.listeners.before.event_exited.dapui_config = function()
        dapui.close()
      end
    end
  },
  {
    "nvim-neotest/nvim-nio"
  },
  {
    "jay-babu/mason-nvim-dap.nvim",
    event="VeryLazy",
    dependencies={
      "williamboman/mason.nvim",
      "mfussenegger/nvim-dap",
    },
    opts ={
      handlers={},
      ensure_installed={
        "codelldb",
      },
    }
  },
  {
    "mfussenegger/nvim-dap",
    config = function (_,_)
      require("core.utils").load_mappings("dap")
    end
  },
  {
    "nvimtools/none-ls.nvim",
    event = "VeryLazy",
    opts =function ()
      return require "custom.configs.null-ls"
    end
  },
  {
    "neovim/nvim-lspconfig",
    config = function ()
      require "plugins.configs.lspconfig"
      require "custom.configs.lspconfig"
    end
  },
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "clangd",
        "clang-format",
        "codelldb"
      }
    }
  }
}
return plugins
