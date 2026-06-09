'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      room_code: {
        type: Sequelize.STRING(6),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    await queryInterface.addIndex('rooms', ['room_code'], { unique: true, name: 'rooms_room_code_unique' });
    await queryInterface.addIndex('rooms', ['owner_id'], { name: 'rooms_owner_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rooms');
  },
};
