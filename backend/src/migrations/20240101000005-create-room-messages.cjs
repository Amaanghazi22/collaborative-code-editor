'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'rooms', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      content: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true,
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

    await queryInterface.addIndex('room_messages', ['room_id'], { name: 'room_messages_room_id' });
    await queryInterface.addIndex('room_messages', ['createdAt'], { name: 'room_messages_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('room_messages');
  },
};
