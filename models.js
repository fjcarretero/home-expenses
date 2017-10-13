var User,
    Item;

function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
    * Model: User
    */
  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'familyId': { type: String, validate: [validatePresenceOf, 'a familyId is required'] },
    'name': String,
    'role': { type: String, validate: [validatePresenceOf, 'a role is required'] }
  });

  User.virtual('id').get(function() {
      return this._id.toHexString();
  });

  /**
    * Model: Item
    */
  Item = new Schema({
  	familyId: { type: String, validate: [validatePresenceOf, 'a familyId is required'] },
	email: { type: String, validate: [validatePresenceOf, 'an email is required'] },
	name: { type: String, validate: [validatePresenceOf, 'a name is required']},
	date: {type: Date, validate: [validatePresenceOf, 'a date is required']},
    price: { type: Number, validate: [validatePresenceOf, 'a price is required'] },
    category: { type: String, enum: ['Comida', 'Ropa', 'Regalos', 'Niños', 'Phill', 'Farmacia', 'Extras'] }
  });
  
  Item.virtual('id').get(function() {
      return this._id.toHexString();
  });
  
  Item.index({name: 1, date: 1, familyId: 1}, {unique: true});
   
  mongoose.model('User', User);
  mongoose.model('Item', Item);
  
  fn();
}

exports.defineModels = defineModels; 