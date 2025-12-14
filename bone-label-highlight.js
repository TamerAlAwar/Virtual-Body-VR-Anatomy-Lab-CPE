// Import the necessary classes from the Wonderland Engine API
import {
  Component,
  Property,
  CollisionComponent,
  Shape,
} from '@wonderlandengine/api';


// Define the class extending the base Component class
export class BoneLabelHighlight extends Component {
  // Set the unique name for this component type in the editor
  static TypeName = 'bone-label-highlight';

  // Define the properties that will appear in the Editor Inspector
  static Properties = {
    // Root object to scan (Skeleton or Muscle system)
    root: Property.object(),

    // Tablet UI object with the 'text' component
    labelObject: Property.object(),

    // Material to apply when highlighted (Wireframe is recommended)
    highlightMaterial: Property.material(),

    // Collision Group (1 = VR Controller, 2 = Mouse/Cursor) 
    collisionGroup: Property.int(1),
  };

  // The start method runs once when the scene initializes
  start() {
    // Check if the label object was assigned and try to get the 'text' component
    this.textComp = this.labelObject
      ? this.labelObject.getComponent('text')
      : null;

    // Initialize the current selection tracker to null
    this._current = null;

    // Determine where to start scanning
    const root = this.root || this.object;
    
    // Start the recursive setup process
    if (root) {
      // Scan this object and all its children
      this._prepareRecursively(root);
    }
  }

  // Scans children. If it finds a mesh, it makes it interactive.
  _prepareRecursively(obj) {
    // Try to get the Mesh component
    const mesh = obj.getComponent('mesh');
    // Try to get the Collision component
    const collision = obj.getComponent('collision');

    // Only process objects that are visible or interactable
    if (mesh || collision) {
      
      // 1. Auto-Hitbox: If missing, create a box around the mesh
      if (!collision) {
        // Add a collision component automatically
        obj.addComponent('collision', {
          shape: Shape.Box,
          group: this.collisionGroup,
        });
      }

      // 2. Cursor Target: Required for interaction events
      let ct = obj.getComponent('cursor-target');
      // If one doesn't exist, add it now
      if (!ct) ct = obj.addComponent('cursor-target');

      // 3. Bind Click: Trigger the interaction logic
      // Add a listener: when clicked, run the _click function
      ct.onClick.add(() => this._click(obj));
    }

    // Recursively check children
    for (const child of obj.children) {
      this._prepareRecursively(child);
    }
  }

  // Writes the bone/muscle name to the UI text.
  _setLabel(name) {
    // Check if we successfully found a text component
    if (this.textComp) {
      // Update the text property to the object's name
      this.textComp.text = name || '';
    }
  }

  // Activates the visuals: Material Swap only
  _highlight(obj) {
    // Get the mesh component of the object
    const mesh = obj.getComponent('mesh');
    // If no mesh, exit
    if (!mesh) return;

    // 1. Backup Original State (Material only)
    if (!mesh._origMat) {
      // Save the current material
      mesh._origMat = mesh.material;
    }

    // 2. Apply Highlight Material
    if (this.highlightMaterial) {
      // Replace the object's material
      mesh.material = this.highlightMaterial;
    }
  }

  // Restores the object to normal (Original Material)
  _unhighlight(obj) {
    // Get the mesh component
    const mesh = obj.getComponent('mesh');
    // If no backup exists, exit
    if (!mesh || !mesh._origMat) return;

    // Restore Material
    mesh.material = mesh._origMat;
    // Clear the backup variable
    mesh._origMat = null;
  }

 // Handle the User Click
  _click(obj) {
    // If clicking the already selected part, do nothing
    if (this._current === obj) return;

    // Reset the previous selection
    if (this._current) {
      // Remove the highlight from it
      this._unhighlight(this._current);
    }

    // Update selection
    this._current = obj;
    
    // Trigger effects
    this._highlight(obj);
    // Update the UI label with the new object's name
    this._setLabel(obj.name);
  }
}