// system-info.js
document.getElementById('fetchButton').addEventListener('click', () => {
    const vpsCost = parseFloat(document.getElementById('vpsCost').value);
  
    fetch(config.apiUrl)
      .then(response => response.json())
      .then(data => {
        // Processador
        document.getElementById('systemInfoContainer').innerHTML = `
          <div class="card bg-white shadow-md rounded-lg p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <h2 class="text-xl font-bold text-blue-600">Processador</h2>
            <p><strong>Modelo:</strong> ${data.cpu.manufacturer} ${data.cpu.brand}</p>
            <p><strong>Carga Atual:</strong> ${data.currentLoad.currentLoad.toFixed(2)}%</p>
          </div>
          <div class="card bg-white shadow-md rounded-lg p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <h2 class="text-xl font-bold text-blue-600">Memória</h2>
            <p><strong>Total:</strong> ${(data.memory.total / (1024 ** 3)).toFixed(2)} GB</p>
            <p><strong>Usada:</strong> ${((data.memory.total - data.memory.available) / (1024 ** 3)).toFixed(2)} GB</p>
          </div>
          <div class="card bg-white shadow-md rounded-lg p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <h2 class="text-xl font-bold text-blue-600">Disco</h2>
            <p><strong>Total:</strong> ${(data.disk[0].size / (1024 ** 3)).toFixed(2)} GB</p>
            <p><strong>Usado:</strong> ${(data.disk[0].used / (1024 ** 3)).toFixed(2)} GB</p>
          </div>
          <div class="card bg-white shadow-md rounded-lg p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
            <h2 class="text-xl font-bold text-blue-600">Pasta Específica</h2>
            <p><strong>Uso de Disco:</strong> ${data.folderDiskUsage.toFixed(2)} MB</p>
          </div>
        `;
  
        // Containers
        const containersList = data.containers.map(container => {
          const totalMemoryGB = (container.memory.total / (1024 ** 3)).toFixed(2);
          const usedMemoryGB = (container.memory.usage / (1024 ** 3)).toFixed(2);
          const cpuCost = (vpsCost * (container.cpu / 100)).toFixed(2);
          const memoryCost = (vpsCost * (usedMemoryGB / totalMemoryGB)).toFixed(2);
          const totalCost = (parseFloat(cpuCost) + parseFloat(memoryCost)).toFixed(2);
          const diskUsedGB = container.diskUsage;
          const roundedCPU = container.cpu.toFixed(2); // Arredondamento da CPU para 2 casas decimais
  
          return `
            <div class="container-item bg-white shadow-md rounded-lg p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
              <p><strong>Nome:</strong> ${container.name}</p>
              <p><strong>CPU:</strong> ${roundedCPU}%</p>
              <p><strong>Memória Total:</strong> ${totalMemoryGB} GB</p>
              <p><strong>Memória Usada:</strong> ${usedMemoryGB} GB</p>
              <p><strong>Disco Usado:</strong> ${diskUsedGB} GB</p>
              <p><strong>Custo (CPU):</strong> R$ ${cpuCost}</p>
              <p><strong>Custo (Memória):</strong> R$ ${memoryCost}</p>
              <p><strong>Custo Total:</strong> R$ ${totalCost}</p>
            </div>
          `;
        }).join('');
        document.getElementById('containersList').innerHTML = containersList;
      })
      .catch(error => {
        console.error('Erro:', error);
      });
  });
  