const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/files', (req, res) => {
  try {
    const dirPath = req.query.path;
    
    if (!dirPath) {
      return res.status(400).json({ error: '请提供文件路径' });
    }

    if (!fs.existsSync(dirPath)) {
      return res.status(400).json({ error: '路径不存在' });
    }

    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: '路径不是文件夹' });
    }

    const files = fs.readdirSync(dirPath).filter(file => {
      const fullPath = path.join(dirPath, file);
      return fs.statSync(fullPath).isFile();
    });

    res.json({ files, path: dirPath });
  } catch (error) {
    console.error('读取文件出错:', error);
    res.status(500).json({ error: '读取文件失败: ' + error.message });
  }
});

app.post('/api/rename', (req, res) => {
  try {
    const { path: dirPath, renames } = req.body;

    if (!dirPath || !renames) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const results = [];

    for (const rename of renames) {
      const { oldName, newName } = rename;
      
      if (!newName || newName.trim() === '') {
        results.push({ oldName, newName, success: true, message: '跳过（新名称为空）' });
        continue;
      }

      const oldPath = path.join(dirPath, oldName);
      const newPath = path.join(dirPath, newName.trim());

      try {
        if (!fs.existsSync(oldPath)) {
          results.push({ oldName, newName, success: false, message: '原文件不存在' });
          continue;
        }

        if (fs.existsSync(newPath)) {
          results.push({ oldName, newName, success: false, message: '目标文件已存在' });
          continue;
        }

        fs.renameSync(oldPath, newPath);
        results.push({ oldName, newName, success: true, message: '重命名成功' });
      } catch (error) {
        console.error('重命名出错:', error);
        results.push({ oldName, newName, success: false, message: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('重命名操作出错:', error);
    res.status(500).json({ error: '重命名失败: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`文件重命名工具已启动，访问地址: http://localhost:${PORT}`);
});
