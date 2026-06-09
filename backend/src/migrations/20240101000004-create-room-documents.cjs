'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_documents', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'rooms', key: 'id' },
        onDelete: 'CASCADE',
      },
      yjs_state: {
        type: Sequelize.BLOB,
        allowNull: true,
      },
      content_snapshot: {
        type: Sequelize.TEXT,
        defaultValue: '// Start coding...',
      },
      language: {
        type: Sequelize.STRING(50),
        defaultValue: 'javascript',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('room_documents');
  },
};
