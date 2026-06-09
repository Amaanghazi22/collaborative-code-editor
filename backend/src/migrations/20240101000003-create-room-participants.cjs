'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_participants', {
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
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('room_participants', ['room_id', 'user_id'], {
      unique: true,
      name: 'room_user_unique',
    });
    await queryInterface.addIndex('room_participants', ['user_id'], { name: 'participant_user' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('room_participants');
  },
};
