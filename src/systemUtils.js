const si = require('systeminformation');

// Função para obter o uso de disco de uma pasta específica na VPS em MB
const getFolderDiskUsage = async (folderPath) => {
  try {
    const disks = await si.fsSize();
    const disk = disks.find(d => folderPath.startsWith(d.mount));
    if (disk) {
      const usage = (disk.used / (1024 ** 2)).toFixed(2); // Convertendo para MB
      return usage;
    } else {
      throw new Error(`Pasta não encontrada ou sem permissão de acesso: ${folderPath}`);
    }
  } catch (error) {
    console.error(`Erro ao obter o uso de disco da pasta ${folderPath}: ${error.message}`);
    return 0;
  }
};

module.exports = {
  getFolderDiskUsage,
};
